import { randomUUID } from "node:crypto";

import {
  freeTrialTokens,
  insufficientTokensMessage,
  paidPackPriceCny,
  paidPackTokens
} from "./config";
import { readJsonFile, writeJsonFile } from "../storage/local-store";

const billingFileName = "billing.json";

type PaymentStatus = "pending" | "approved" | "rejected";
type PaymentAction = "approve" | "reject";

export type BillingAccount = {
  userId: string;
  balanceTokens: number;
  grantedTrialTokens: number;
  createdAt: string;
  updatedAt: string;
};

export type PaymentRequest = {
  id: string;
  userId: string;
  amountCny: number;
  tokenAmount: number;
  payerName: string;
  contact: string;
  paymentNote: string;
  proofText: string;
  status: PaymentStatus;
  createdAt: string;
  reviewedAt?: string;
};

export type TokenCharge = {
  id: string;
  userId: string;
  tokens: number;
  reason: string;
  createdAt: string;
};

type BillingLedger = {
  accounts: BillingAccount[];
  paymentRequests: PaymentRequest[];
  charges: TokenCharge[];
};

type PaymentRequestInput = {
  payerName: string;
  contact: string;
  paymentNote: string;
  proofText: string;
};

export class InsufficientTokensError extends Error {
  constructor() {
    super(insufficientTokensMessage);
    this.name = "InsufficientTokensError";
  }
}

export async function getBillingStatus(userId?: string) {
  const ledger = await readBillingLedger();
  const { account, ledger: nextLedger } = ensureAccount(ledger, userId);

  await writeBillingLedger(nextLedger);

  return {
    account,
    pendingPaymentRequests: nextLedger.paymentRequests.filter(
      (request) => request.userId === account.userId && request.status === "pending"
    ),
    paidPackPriceCny,
    paidPackTokens,
    freeTrialTokens
  };
}

export async function ensureSufficientTokens(userId: string, tokens: number) {
  const { account } = await getBillingStatus(userId);

  if (account.balanceTokens < tokens) {
    throw new InsufficientTokensError();
  }

  return account;
}

export async function chargeTokens(
  userId: string,
  tokens: number,
  reason: string
) {
  const ledger = await readBillingLedger();
  const { account, ledger: nextLedger } = ensureAccount(ledger, userId);
  const chargeAmount = Math.max(1, Math.ceil(tokens));

  if (account.balanceTokens < chargeAmount) {
    throw new InsufficientTokensError();
  }

  account.balanceTokens -= chargeAmount;
  account.updatedAt = now();
  nextLedger.charges.push({
    id: randomUUID(),
    userId: account.userId,
    tokens: chargeAmount,
    reason,
    createdAt: now()
  });

  await writeBillingLedger(nextLedger);

  return account;
}

export async function setTokenBalance(userId: string, balanceTokens: number) {
  const ledger = await readBillingLedger();
  const { account } = ensureAccount(ledger, userId);

  account.balanceTokens = Math.max(0, Math.floor(balanceTokens));
  account.updatedAt = now();
  await writeBillingLedger(ledger);

  return account;
}

export async function getAccount(userId: string) {
  const { account } = await getBillingStatus(userId);

  return account;
}

export async function createPaymentRequest(
  userId: string,
  input: PaymentRequestInput
) {
  const ledger = await readBillingLedger();
  const { account, ledger: nextLedger } = ensureAccount(ledger, userId);
  const paymentRequest: PaymentRequest = {
    id: randomUUID(),
    userId: account.userId,
    amountCny: paidPackPriceCny,
    tokenAmount: paidPackTokens,
    payerName: input.payerName.trim(),
    contact: input.contact.trim(),
    paymentNote: input.paymentNote.trim(),
    proofText: input.proofText.trim(),
    status: "pending",
    createdAt: now()
  };

  nextLedger.paymentRequests.push(paymentRequest);
  await writeBillingLedger(nextLedger);

  return paymentRequest;
}

export async function reviewPaymentRequest({
  id,
  action,
  adminToken,
  adminUserAuthorized = false
}: {
  id: string;
  action: PaymentAction;
  adminToken: string;
  adminUserAuthorized?: boolean;
}) {
  if (
    !adminUserAuthorized &&
    (!process.env.ADMIN_TOKEN || adminToken !== process.env.ADMIN_TOKEN)
  ) {
    throw new Error("管理员口令无效。");
  }

  const ledger = await readBillingLedger();
  const paymentRequest = ledger.paymentRequests.find((request) => request.id === id);

  if (!paymentRequest) {
    throw new Error("充值申请不存在。");
  }

  if (paymentRequest.status !== "pending") {
    return paymentRequest;
  }

  paymentRequest.status = action === "approve" ? "approved" : "rejected";
  paymentRequest.reviewedAt = now();

  if (paymentRequest.status === "approved") {
    const { account } = ensureAccount(ledger, paymentRequest.userId);

    account.balanceTokens += paymentRequest.tokenAmount;
    account.updatedAt = now();
  }

  await writeBillingLedger(ledger);

  return paymentRequest;
}

async function readBillingLedger(): Promise<BillingLedger> {
  const ledger = await readJsonFile<BillingLedger>(billingFileName, {
    accounts: [],
    paymentRequests: [],
    charges: []
  });

  return {
    accounts: Array.isArray(ledger.accounts) ? ledger.accounts : [],
    paymentRequests: Array.isArray(ledger.paymentRequests)
      ? ledger.paymentRequests
      : [],
    charges: Array.isArray(ledger.charges) ? ledger.charges : []
  };
}

async function writeBillingLedger(ledger: BillingLedger) {
  await writeJsonFile(billingFileName, ledger);
}

function ensureAccount(ledger: BillingLedger, userId?: string) {
  const safeUserId = sanitizeUserId(userId) || randomUUID();
  let account = ledger.accounts.find((item) => item.userId === safeUserId);

  if (!account) {
    account = {
      userId: safeUserId,
      balanceTokens: freeTrialTokens,
      grantedTrialTokens: freeTrialTokens,
      createdAt: now(),
      updatedAt: now()
    };
    ledger.accounts.push(account);
  }

  return { account, ledger };
}

function sanitizeUserId(userId?: string) {
  if (!userId) {
    return "";
  }

  return /^[a-zA-Z0-9_-]{1,96}$/.test(userId) ? userId : "";
}

function now() {
  return new Date().toISOString();
}
