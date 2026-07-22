import { NextResponse } from "next/server";

import { requireSessionUser } from "../../../../lib/auth/http";
import {
  getBillingUserIdForRequest,
  setBillingCookie
} from "../../../../lib/billing/http";
import { getBillingStatus } from "../../../../lib/billing/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireSessionUser(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "请先登录。" },
      { status: 401 }
    );
  }

  const status = await getBillingStatus(await getBillingUserIdForRequest(request));
  const response = NextResponse.json(status);

  return setBillingCookie(response, status.account.userId);
}
