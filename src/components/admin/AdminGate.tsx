"use client";

import Link from "next/link";
import React from "react";
import { useEffect, useState } from "react";

import { LoginPanel } from "@/components/auth/LoginPanel";
import type { AuthUser } from "@/components/auth/types";

import { AdminDashboard } from "./AdminDashboard";

export function AdminGate() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadUser();
  }, []);

  async function loadUser() {
    try {
      const response = await fetch("/api/auth/me");
      const data = (await response.json()) as { user?: AuthUser | null };

      setUser(response.ok ? data.user ?? null : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-sm text-[#516070]">
        正在检查管理员权限...
      </main>
    );
  }

  if (!user) {
    return <LoginPanel onAuthenticated={setUser} />;
  }

  if (user.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-4 py-10 text-[#172033]">
        <section className="w-full max-w-md rounded-lg border border-[#d8dee8] bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[#2d7180]">
            Admin
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-normal">
            需要管理员权限
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#516070]">
            当前登录账号 {user.email} 不是管理员。请使用配置为 ADMIN_EMAIL
            的邮箱登录，或让现有管理员在后台将该账号设为 admin。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              className="rounded-md border border-[#c7d0dc] bg-white px-3 py-2 text-sm font-semibold text-[#354256]"
              href="/"
            >
              返回工作台
            </Link>
            <button
              className="rounded-md bg-[#172033] px-3 py-2 text-sm font-semibold text-white"
              onClick={logout}
              type="button"
            >
              退出并切换账号
            </button>
          </div>
        </section>
      </main>
    );
  }

  return <AdminDashboard />;
}
