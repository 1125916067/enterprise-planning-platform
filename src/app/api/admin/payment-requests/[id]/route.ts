import { NextResponse } from "next/server";

import { getSessionUser } from "../../../../../lib/auth/http";
import { reviewPaymentRequest } from "../../../../../lib/billing/store";

export const runtime = "nodejs";

const invalidJsonMessage = "请求 JSON 格式无效，请检查后重试。";
const invalidActionMessage = "审核动作无效，请使用 approve 或 reject。";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: unknown;

  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: invalidJsonMessage }, { status: 400 });
  }

  const record = toRecord(body);
  const action = record.action;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: invalidActionMessage }, { status: 400 });
  }

  try {
    const { id } = await params;
    const sessionUser = await getSessionUser(request);
    const adminToken = stringValue(record.adminToken);

    if (sessionUser?.user.role !== "admin" && !adminToken) {
      return NextResponse.json({ error: "需要管理员权限。" }, { status: 403 });
    }

    const paymentRequest = await reviewPaymentRequest({
      id,
      action,
      adminToken,
      adminUserAuthorized: sessionUser?.user.role === "admin"
    });

    return NextResponse.json({ paymentRequest });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "审核失败。" },
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
