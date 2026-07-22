import { NextResponse } from "next/server";

import { isValidEmail, normalizeEmail } from "../../../../lib/auth/config";
import { publicUser, setAuthCookie } from "../../../../lib/auth/http";
import { registerUserWithPassword } from "../../../../lib/auth/store";
import { setBillingCookie } from "../../../../lib/billing/http";

export const runtime = "nodejs";

const invalidJsonMessage = "请求 JSON 格式无效，请检查后重试。";
const invalidEmailMessage = "邮箱格式无效，请检查后重试。";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: invalidJsonMessage }, { status: 400 });
  }

  const record = toRecord(body);
  const email = normalizeEmail(stringValue(record.email));
  const password = stringValue(record.password);

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: invalidEmailMessage }, { status: 400 });
  }

  try {
    const { user, session } = await registerUserWithPassword(email, password);
    const response = NextResponse.json({ user: publicUser(user) });

    setAuthCookie(response, session.token);
    setBillingCookie(response, user.id);

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "注册失败。";

    return NextResponse.json(
      { error: message },
      { status: message.includes("已注册") ? 409 : 400 }
    );
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
