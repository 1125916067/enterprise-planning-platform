import { type NextResponse } from "next/server";

import { authSessionCookieName } from "./config";
import { getUserBySessionToken, type UserRecord } from "./store";

export function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [key, ...valueParts] = item.split("=");

        return [key, decodeURIComponent(valueParts.join("="))];
      })
  );

  return cookies[name] || "";
}

export function getAuthSessionToken(request: Request) {
  return getCookieValue(request, authSessionCookieName);
}

export async function getSessionUser(request: Request) {
  return getUserBySessionToken(getAuthSessionToken(request));
}

export async function rejectInvalidSession(request: Request) {
  const token = getAuthSessionToken(request);

  if (token && !(await getUserBySessionToken(token))) {
    throw new Error("登录状态无效，请重新登录。");
  }
}

export async function requireSessionUser(request: Request) {
  const sessionUser = await getSessionUser(request);

  if (!sessionUser) {
    throw new Error("请先登录。");
  }

  return sessionUser;
}

export async function requireAdminUser(request: Request) {
  const sessionUser = await getSessionUser(request);

  if (!sessionUser || sessionUser.user.role !== "admin") {
    throw new Error("需要管理员权限。");
  }

  return sessionUser;
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(authSessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(authSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });

  return response;
}

export function publicUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status
  };
}
