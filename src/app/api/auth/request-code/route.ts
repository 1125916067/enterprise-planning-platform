import { NextResponse } from "next/server";

import { sendVerificationEmail } from "../../../../lib/auth/email";
import { isValidEmail, normalizeEmail } from "../../../../lib/auth/config";
import { createEmailCode } from "../../../../lib/auth/store";

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

  const email = normalizeEmail(toRecord(body).email as string);

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: invalidEmailMessage }, { status: 400 });
  }

  const codeRecord = await createEmailCode(email);
  const delivery = await sendVerificationEmail({
    email,
    code: codeRecord.code
  });

  return NextResponse.json({
    ok: true,
    delivered: delivery.delivered,
    message: delivery.delivered
      ? "验证码已发送，请检查邮箱。"
      : "开发环境验证码已生成，请查看 .local-data/email-codes.json。"
  });
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
