import {
  randomBytes,
  randomInt,
  randomUUID,
  scrypt,
  timingSafeEqual
} from "node:crypto";
import { promisify } from "node:util";

import {
  adminEmail,
  emailCodeTtlMs,
  isValidEmail,
  normalizeEmail
} from "./config";
import { readJsonFile, writeJsonFile } from "../storage/local-store";

const usersFileName = "users.json";
const sessionsFileName = "sessions.json";
const codesFileName = "email-codes.json";
const scryptAsync = promisify(scrypt);

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "disabled";

export type UserRecord = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  passwordHash?: string;
};

export type SessionRecord = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type EmailCodeRecord = {
  email: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  failedAttempts?: number;
  consumedAt?: string;
};

type UsersLedger = {
  users: UserRecord[];
};

type SessionsLedger = {
  sessions: SessionRecord[];
};

type CodesLedger = {
  codes: EmailCodeRecord[];
};

export async function createEmailCode(email: string) {
  const normalizedEmail = normalizeAndValidateEmail(email);
  const ledger = await readCodesLedger();
  const codeRecord: EmailCodeRecord = {
    email: normalizedEmail,
    code: String(randomInt(0, 1_000_000)).padStart(6, "0"),
    createdAt: now(),
    expiresAt: new Date(Date.now() + emailCodeTtlMs).toISOString()
  };

  ledger.codes = ledger.codes.filter(
    (item) => item.email !== normalizedEmail || Boolean(item.consumedAt)
  );
  ledger.codes.push(codeRecord);
  await writeJsonFile(codesFileName, ledger);

  return codeRecord;
}

export async function verifyEmailCode(email: string, code: string) {
  const normalizedEmail = normalizeAndValidateEmail(email);
  const trimmedCode = code.trim();
  const codesLedger = await readCodesLedger();
  const codeRecord = codesLedger.codes.find(
    (item) =>
      item.email === normalizedEmail &&
      item.code === trimmedCode &&
      !item.consumedAt &&
      Date.parse(item.expiresAt) >= Date.now()
  );

  if (!codeRecord) {
    const activeCode = codesLedger.codes.find(
      (item) =>
        item.email === normalizedEmail &&
        !item.consumedAt &&
        Date.parse(item.expiresAt) >= Date.now()
    );

    if (activeCode) {
      activeCode.failedAttempts = (activeCode.failedAttempts || 0) + 1;

      if (activeCode.failedAttempts >= 5) {
        activeCode.consumedAt = now();
      }

      await writeJsonFile(codesFileName, codesLedger);
    }

    throw new Error("验证码无效或已过期。");
  }

  if ((codeRecord.failedAttempts || 0) >= 5) {
    codeRecord.consumedAt = now();
    await writeJsonFile(codesFileName, codesLedger);
    throw new Error("验证码无效或已过期。");
  }

  codeRecord.consumedAt = now();
  await writeJsonFile(codesFileName, codesLedger);

  const user = await upsertUserByEmail(normalizedEmail);
  const session = await createSession(user.id);

  return { user, session };
}

export async function registerUserWithPassword(email: string, password: string) {
  const normalizedEmail = normalizeAndValidateEmail(email);
  validatePassword(password);
  const ledger = await readUsersLedger();
  const existingUser = ledger.users.find((item) => item.email === normalizedEmail);

  if (existingUser) {
    throw new Error("该邮箱已注册，请直接登录。");
  }

  const user: UserRecord = {
    id: randomUUID(),
    email: normalizedEmail,
    role: roleForEmail(normalizedEmail),
    status: "active",
    createdAt: now(),
    updatedAt: now(),
    lastLoginAt: now(),
    passwordHash: await hashPassword(password)
  };

  ledger.users.push(user);
  await writeJsonFile(usersFileName, ledger);

  const session = await createSession(user.id);

  return { user, session };
}

export async function loginUserWithPassword(email: string, password: string) {
  const normalizedEmail = normalizeAndValidateEmail(email);
  const ledger = await readUsersLedger();
  const user = ledger.users.find((item) => item.email === normalizedEmail);

  if (!user || !user.passwordHash) {
    throw new Error("邮箱或密码错误。");
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new Error("邮箱或密码错误。");
  }

  if (user.status !== "active") {
    throw new Error("账号已停用，请联系管理员。");
  }

  if (roleForEmail(normalizedEmail) === "admin") {
    user.role = "admin";
  }

  user.lastLoginAt = now();
  user.updatedAt = now();
  await writeJsonFile(usersFileName, ledger);

  const session = await createSession(user.id);

  return { user, session };
}

export async function getUserBySessionToken(token: string) {
  const sessionToken = token.trim();

  if (!sessionToken) {
    return null;
  }

  const sessionsLedger = await readSessionsLedger();
  const session = sessionsLedger.sessions.find(
    (item) => item.token === sessionToken && Date.parse(item.expiresAt) > Date.now()
  );

  if (!session) {
    return null;
  }

  const usersLedger = await readUsersLedger();
  const user = usersLedger.users.find((item) => item.id === session.userId);

  if (!user || user.status !== "active") {
    return null;
  }

  return { user, session };
}

export async function listUsers() {
  const ledger = await readUsersLedger();

  return ledger.users;
}

export async function updateUser({
  userId,
  role,
  status
}: {
  userId: string;
  role?: UserRole;
  status?: UserStatus;
}) {
  const ledger = await readUsersLedger();
  const user = ledger.users.find((item) => item.id === userId);

  if (!user) {
    throw new Error("用户不存在。");
  }

  const nextRole = role || user.role;
  const nextStatus = status || user.status;

  if (
    user.role === "admin" &&
    user.status === "active" &&
    (nextRole !== "admin" || nextStatus !== "active") &&
    activeAdminCount(ledger.users) <= 1
  ) {
    throw new Error("至少需要保留一个启用状态的管理员。");
  }

  if (role) {
    user.role = role;
  }

  if (status) {
    user.status = status;
  }

  user.updatedAt = now();
  await writeJsonFile(usersFileName, ledger);

  return user;
}

function activeAdminCount(users: UserRecord[]) {
  return users.filter(
    (user) => user.role === "admin" && user.status === "active"
  ).length;
}

export async function deleteSession(token: string) {
  const ledger = await readSessionsLedger();

  ledger.sessions = ledger.sessions.filter((item) => item.token !== token);
  await writeJsonFile(sessionsFileName, ledger);
}

async function upsertUserByEmail(email: string) {
  const ledger = await readUsersLedger();
  let user = ledger.users.find((item) => item.email === email);
  const role = roleForEmail(email);

  if (!user) {
    user = {
      id: randomUUID(),
      email,
      role,
      status: "active",
      createdAt: now(),
      updatedAt: now()
    };
    ledger.users.push(user);
  } else {
    if (role === "admin") {
      user.role = "admin";
    }
    user.lastLoginAt = now();
    user.updatedAt = now();
  }

  if (!user.lastLoginAt) {
    user.lastLoginAt = now();
  }

  await writeJsonFile(usersFileName, ledger);

  return user;
}

async function createSession(userId: string) {
  const ledger = await readSessionsLedger();
  const session: SessionRecord = {
    token: randomUUID(),
    userId,
    createdAt: now(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
  };

  ledger.sessions = ledger.sessions.filter(
    (item) => Date.parse(item.expiresAt) > Date.now()
  );
  ledger.sessions.push(session);
  await writeJsonFile(sessionsFileName, ledger);

  return session;
}

async function readUsersLedger(): Promise<UsersLedger> {
  const ledger = await readJsonFile<UsersLedger>(usersFileName, { users: [] });

  return { users: Array.isArray(ledger.users) ? ledger.users : [] };
}

async function readSessionsLedger(): Promise<SessionsLedger> {
  const ledger = await readJsonFile<SessionsLedger>(sessionsFileName, {
    sessions: []
  });

  return { sessions: Array.isArray(ledger.sessions) ? ledger.sessions : [] };
}

async function readCodesLedger(): Promise<CodesLedger> {
  const ledger = await readJsonFile<CodesLedger>(codesFileName, { codes: [] });

  return { codes: Array.isArray(ledger.codes) ? ledger.codes : [] };
}

function normalizeAndValidateEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    throw new Error("邮箱格式无效。");
  }

  return normalizedEmail;
}

function validatePassword(password: string) {
  if (password.trim().length < 6) {
    throw new Error("密码至少需要 6 位。");
  }
}

function roleForEmail(email: string): UserRole {
  return email === adminEmail() ? "admin" : "user";
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedKey] = passwordHash.split(":");

  if (algorithm !== "scrypt" || !salt || !storedKey) {
    return false;
  }

  const storedBuffer = Buffer.from(storedKey, "hex");
  const derivedKey = (await scryptAsync(password, salt, storedBuffer.length)) as Buffer;

  return (
    storedBuffer.length === derivedKey.length &&
    timingSafeEqual(storedBuffer, derivedKey)
  );
}

function now() {
  return new Date().toISOString();
}
