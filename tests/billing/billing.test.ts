import { afterEach, describe, expect, it, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tmpdir } from "node:os";

describe("billing store", () => {
  const originalCwd = process.cwd();
  let tempDir = "";

  afterEach(async () => {
    vi.unstubAllEnvs();
    process.chdir(originalCwd);

    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  async function useTempCwd() {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), "billing-store-"));
    process.chdir(tempDir);
  }

  it("creates a new account with 500 trial tokens", async () => {
    await useTempCwd();
    const { getBillingStatus } = await import("../../src/lib/billing/store");

    const status = await getBillingStatus();

    expect(status.account.balanceTokens).toBe(500);
    expect(status.account.grantedTrialTokens).toBe(500);
    expect(status.account.userId).toEqual(expect.any(String));
  });

  it("approves a 5 CNY payment request and grants 10000 tokens", async () => {
    await useTempCwd();
    vi.stubEnv("ADMIN_TOKEN", "admin-secret");
    const {
      createPaymentRequest,
      getBillingStatus,
      reviewPaymentRequest
    } = await import("../../src/lib/billing/store");

    const status = await getBillingStatus("buyer-1");
    const paymentRequest = await createPaymentRequest(status.account.userId, {
      payerName: "张三",
      contact: "wxid-demo",
      paymentNote: "7月22日 5元",
      proofText: "已通过微信二维码支付"
    });

    expect(paymentRequest.status).toBe("pending");

    const reviewed = await reviewPaymentRequest({
      id: paymentRequest.id,
      action: "approve",
      adminToken: "admin-secret"
    });
    const nextStatus = await getBillingStatus("buyer-1");

    expect(reviewed.status).toBe("approved");
    expect(nextStatus.account.balanceTokens).toBe(10500);
  });

  it("rejects payment review when the admin token is invalid", async () => {
    await useTempCwd();
    vi.stubEnv("ADMIN_TOKEN", "admin-secret");
    const { createPaymentRequest, reviewPaymentRequest } = await import(
      "../../src/lib/billing/store"
    );
    const paymentRequest = await createPaymentRequest("buyer-2", {
      payerName: "李四",
      contact: "wxid-demo",
      paymentNote: "7月22日 5元",
      proofText: "已付款"
    });

    await expect(
      reviewPaymentRequest({
        id: paymentRequest.id,
        action: "approve",
        adminToken: "wrong-token"
      })
    ).rejects.toThrow("管理员口令无效");
  });

  it("charges tokens and blocks over-limit usage", async () => {
    await useTempCwd();
    const { chargeTokens, ensureSufficientTokens, getBillingStatus } =
      await import("../../src/lib/billing/store");

    await getBillingStatus("buyer-3");
    await chargeTokens("buyer-3", 120, "chat");

    const status = await getBillingStatus("buyer-3");

    expect(status.account.balanceTokens).toBe(380);
    await expect(ensureSufficientTokens("buyer-3", 381)).rejects.toThrow(
      "token 余额不足"
    );
  });
});
