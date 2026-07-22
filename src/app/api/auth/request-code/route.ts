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
  const isDevelopmentFallback =
    !delivery.delivered && process.env.NODE_ENV !== "production";

  return NextResponse.json({
    ok: true,
    delivered: delivery.delivered,
    devCode: isDevelopmentFallback ? codeRecord.code : undefined,
    message: delivery.delivered
      ? "验证码已发送，请检查邮箱。"
      : isDevelopmentFallback
        ? `开发环境验证码：${codeRecord.code}`
        : "验证码已生成，但邮件服务未配置，请联系管理员。"
  });
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
