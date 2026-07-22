"use client";

import { Mail, ShieldCheck } from "lucide-react";
import React from "react";
import { type FormEvent, useState } from "react";

import type { AuthUser } from "./types";

export function LoginPanel({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setMessage(data.error ?? "验证码发送失败。");
        return;
      }

      setCodeRequested(true);
      setMessage(data.message ?? "验证码已发送，请检查邮箱。");
    } catch {
      setMessage("验证码发送失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const data = (await response.json()) as { user?: AuthUser; error?: string };

      if (!response.ok || !data.user) {
        setMessage(data.error ?? "登录失败，请检查验证码。");
        return;
      }

      onAuthenticated(data.user);
    } catch {
      setMessage("登录失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4 py-10 text-[#172033]">
      <section className="w-full max-w-md rounded-lg border border-[#d8dee8] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-[#e8f1f4] p-3 text-[#2d7180]">
            <ShieldCheck aria-hidden="true" size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#2d7180]">
              Enterprise Login
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-normal">
              邮箱验证码登录
            </h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#516070]">
          输入邮箱获取验证码。首次验证会自动注册账号，并赠送 500 token。
        </p>

        <form className="mt-5 space-y-3" onSubmit={requestCode}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#243044]">邮箱</span>
            <div className="flex gap-2">
              <input
                className="min-h-11 flex-1 rounded-md border border-[#c7d0dc] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2d7180] focus:ring-2 focus:ring-[#d8edf1]"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#2d7180] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#245b66] disabled:opacity-50"
                disabled={loading}
                type="submit"
              >
                <Mail aria-hidden="true" size={16} />
                获取
              </button>
            </div>
          </label>
        </form>

        <form className="mt-4 space-y-3" onSubmit={verifyCode}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[#243044]">验证码</span>
            <input
              className="min-h-11 w-full rounded-md border border-[#c7d0dc] bg-white px-3 py-2 text-sm tracking-normal outline-none transition focus:border-[#2d7180] focus:ring-2 focus:ring-[#d8edf1]"
              disabled={!codeRequested}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setCode(event.target.value)}
              required
              value={code}
            />
          </label>
          <button
            className="min-h-11 w-full rounded-md bg-[#172033] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#243044] disabled:opacity-50"
            disabled={!codeRequested || loading || code.length !== 6}
            type="submit"
          >
            登录 / 注册
          </button>
        </form>

        {message ? (
          <div className="mt-4 rounded-md border border-[#d8dee8] bg-[#f4f7f9] px-3 py-2 text-sm leading-6 text-[#516070]">
            {message}
          </div>
        ) : null}
      </section>
    </main>
  );
}
