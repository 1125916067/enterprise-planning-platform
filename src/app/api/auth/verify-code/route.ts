import { NextResponse } from "next/server";

import { setAuthCookie } from "../../../../lib/auth/http";
import { isValidEmail, normalizeEmail } from "../../../../lib/auth/config";
import { verifyEmailCode } from "../../../../lib/auth/store";
import { setBillingCookie } from "../../../../lib/billing/http";

export const runtime = "nodejs";

const invalidJsonMessage = "请求 JSON 格式无效，请检查后重试。";
const invalidEmailMessage = "邮箱格式无效，请检查后重试。";
const invalidCodeMessage = "验证码必须是 6 位数字。";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: invalidJsonMessage }, { status: 400 });
  }

  const record = toRecord(body);
  const email = normalizeEmail(stringValue(record.email));
  const code = stringValue(record.code);

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: invalidEmailMessage }, { status: 400 });
  }

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: invalidCodeMessage }, { status: 400 });
  }

  try {
    const { user, session } = await verifyEmailCode(email, code);
    const response = NextResponse.json({ user });

    setAuthCookie(response, session.token);
    setBillingCookie(response, user.id);

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "登录失败。" },
      { status: 400 }
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
