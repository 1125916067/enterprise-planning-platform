import { NextResponse } from "next/server";

import { getBillingUserId, setBillingCookie } from "../../../../lib/billing/http";
import {
  createPaymentRequest,
  getBillingStatus
} from "../../../../lib/billing/store";

export const runtime = "nodejs";

const invalidJsonMessage = "请求 JSON 格式无效，请检查后重试。";
const invalidPaymentMessage = "请填写付款人、联系方式和付款凭证。";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: invalidJsonMessage }, { status: 400 });
  }

  const record = toRecord(body);
  const payerName = stringValue(record.payerName);
  const contact = stringValue(record.contact);
  const paymentNote = stringValue(record.paymentNote);
  const proofText = stringValue(record.proofText);

  if (!payerName || !contact || !proofText) {
    return NextResponse.json({ error: invalidPaymentMessage }, { status: 400 });
  }

  const status = await getBillingStatus(getBillingUserId(request));
  const paymentRequest = await createPaymentRequest(status.account.userId, {
    payerName,
    contact,
    paymentNote,
    proofText
  });
  const response = NextResponse.json({ paymentRequest }, { status: 201 });

  return setBillingCookie(response, status.account.userId);
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
