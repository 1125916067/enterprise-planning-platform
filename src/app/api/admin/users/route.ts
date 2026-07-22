import { NextResponse } from "next/server";

import { requireAdminUser } from "../../../../lib/auth/http";
import { listUsers, updateUser } from "../../../../lib/auth/store";
import {
  getAccount,
  setTokenBalance
} from "../../../../lib/billing/store";

export const runtime = "nodejs";

const invalidJsonMessage = "请求 JSON 格式无效，请检查后重试。";

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);
    const users = await Promise.all(
      (await listUsers()).map(async (user) => ({
        ...user,
        balanceTokens: (await getAccount(user.id)).balanceTokens
      }))
    );

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "需要管理员权限。" }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminUser(request);
  } catch {
    return NextResponse.json({ error: "需要管理员权限。" }, { status: 403 });
  }

  let body: unknown;

  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: invalidJsonMessage }, { status: 400 });
  }

  const record = toRecord(body);
  const userId = stringValue(record.userId);
  const role = record.role === "admin" || record.role === "user" ? record.role : undefined;
  const status =
    record.status === "active" || record.status === "disabled"
      ? record.status
      : undefined;

  try {
    const user = await updateUser({ userId, role, status });
    const account =
      typeof record.balanceTokens === "number"
        ? await setTokenBalance(user.id, record.balanceTokens)
        : await getAccount(user.id);

    return NextResponse.json({
      user: {
        ...user,
        balanceTokens: account.balanceTokens
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "用户更新失败。" },
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
