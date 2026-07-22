"use client";

import React from "react";
import { useEffect, useState } from "react";

import { PlanningWorkspace } from "@/components/planning/PlanningWorkspace";

import { LoginPanel } from "./LoginPanel";
import type { AuthUser } from "./types";

export function AuthGate() {
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
        正在检查登录状态...
      </main>
    );
  }

  if (!user) {
    return <LoginPanel onAuthenticated={setUser} />;
  }

  return <PlanningWorkspace onLogout={logout} user={user} />;
}
