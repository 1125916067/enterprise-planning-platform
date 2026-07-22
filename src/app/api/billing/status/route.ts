import { NextResponse } from "next/server";

import { getBillingUserId, setBillingCookie } from "../../../../lib/billing/http";
import { getBillingStatus } from "../../../../lib/billing/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const status = await getBillingStatus(getBillingUserId(request));
  const response = NextResponse.json(status);

  return setBillingCookie(response, status.account.userId);
}
