"use client";

import { RefreshCw } from "lucide-react";
import React from "react";
import { type FormEvent, useEffect, useState } from "react";

type BillingStatus = {
  account: {
    balanceTokens: number;
  };
  pendingPaymentRequests: Array<{ id: string; status: string }>;
  paidPackPriceCny: number;
  paidPackTokens: number;
  freeTrialTokens: number;
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

const inputClass =
  "w-full rounded-md border border-[#c7d0dc] bg-white px-3 py-2 text-sm text-[#172033] outline-none transition focus:border-[#2d7180] focus:ring-2 focus:ring-[#d8edf1]";

export function BillingPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [payerName, setPayerName] = useState("");
  const [contact, setContact] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [proofText, setProofText] = useState("");
  const [message, setMessage] = useState<MessageState>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadStatus();
  }, [refreshKey]);

  async function loadStatus() {
    try {
      const response = await fetch("/api/billing/status");
      const data = (await response.json()) as BillingStatus;

      if (response.ok && isBillingStatus(data)) {
        setStatus(data);
      }
    } catch {
      setMessage({ type: "error", text: "额度信息加载失败，请刷新后重试。" });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/billing/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payerName, contact, paymentNote, proofText })
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error ?? "充值申请提交失败，请检查付款信息。"
        });
        return;
      }

      setPayerName("");
      setContact("");
      setPaymentNote("");
      setProofText("");
      setMessage({
        type: "success",
        text: "充值申请已提交，管理员审核后会自动增加 10000 token。"
      });
      await loadStatus();
    } catch {
      setMessage({ type: "error", text: "充值申请提交失败，请稍后重试。" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#d8dee8] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[#2d7180]">
            Token Billing
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-normal text-[#172033]">
            额度与充值
          </h2>
        </div>
        <button
          aria-label="刷新 token 余额"
          className="rounded-md border border-[#d8dee8] p-2 text-[#516070] transition hover:bg-[#f4f7f9]"
          onClick={loadStatus}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={16} />
        </button>
      </div>

      <div className="mt-4 rounded-md bg-[#f4f7f9] px-3 py-3 text-sm leading-6 text-[#354256]">
        <div className="font-semibold text-[#172033]">
          剩余 token：{status ? status.account.balanceTokens : "加载中"}
        </div>
        <div className="mt-1">
          新用户赠送 {status?.freeTrialTokens ?? 500} token，5 元购买{" "}
          {status?.paidPackTokens ?? 10000} token。
        </div>
        {status?.pendingPaymentRequests.length ? (
          <div className="mt-1 text-[#8a5a00]">
            有 {status.pendingPaymentRequests.length} 笔充值申请待审核。
          </div>
        ) : null}
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-[#d8dee8] bg-[#06c160] p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- QR code should be served unchanged; Next image optimization would add unnecessary sharp exposure. */}
        <img
          alt="微信支付二维码，5 元购买 10000 token"
          className="mx-auto w-full max-w-48 rounded bg-white"
          src="/payments/wechat-pay.jpg"
        />
      </div>

      <form className="mt-4 space-y-3" onSubmit={submit}>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-[#516070]">付款人</span>
          <input
            className={inputClass}
            onChange={(event) => setPayerName(event.target.value)}
            required
            value={payerName}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-[#516070]">
            联系方式或微信昵称
          </span>
          <input
            className={inputClass}
            onChange={(event) => setContact(event.target.value)}
            required
            value={contact}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-[#516070]">
            付款备注/时间
          </span>
          <input
            className={inputClass}
            onChange={(event) => setPaymentNote(event.target.value)}
            placeholder="例如：7月22日 5元"
            value={paymentNote}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-[#516070]">付款凭证</span>
          <textarea
            className={`${inputClass} min-h-20 resize-y leading-6`}
            onChange={(event) => setProofText(event.target.value)}
            placeholder="填写付款截图关键信息、交易单号或付款说明"
            required
            value={proofText}
          />
        </label>

        {message ? (
          <div
            className={`rounded-md border px-3 py-2 text-sm leading-6 ${
              message.type === "success"
                ? "border-[#b7d7c4] bg-[#f1fbf5] text-[#276749]"
                : "border-[#f3b8b8] bg-[#fff5f5] text-[#b42318]"
            }`}
            role="status"
          >
            {message.text}
          </div>
        ) : null}

        <button
          className="min-h-11 w-full rounded-md bg-[#2d7180] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#245b66] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
          type="submit"
        >
          {loading ? "正在提交..." : "提交充值申请"}
        </button>
      </form>
    </section>
  );
}

function isBillingStatus(value: unknown): value is BillingStatus {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<BillingStatus>;

  return (
    Boolean(record.account) &&
    typeof record.account?.balanceTokens === "number" &&
    Array.isArray(record.pendingPaymentRequests)
  );
}
