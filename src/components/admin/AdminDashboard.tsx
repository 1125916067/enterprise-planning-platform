"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "disabled";
  balanceTokens: number;
  createdAt: string;
  lastLoginAt?: string;
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

export function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState<MessageState>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/users");
      const data = (await response.json()) as {
        users?: AdminUser[];
        error?: string;
      };

      if (!response.ok || !data.users) {
        setMessage({ type: "error", text: data.error ?? "用户数据加载失败。" });
        return;
      }

      setUsers(data.users);
    } catch {
      setMessage({ type: "error", text: "用户数据加载失败，请稍后重试。" });
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(user: AdminUser) {
    setMessage(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          role: user.role,
          status: user.status,
          balanceTokens: user.balanceTokens
        })
      });
      const data = (await response.json()) as {
        user?: AdminUser;
        error?: string;
      };

      if (!response.ok || !data.user) {
        setMessage({ type: "error", text: data.error ?? "用户更新失败。" });
        return;
      }

      setUsers((items) =>
        items.map((item) => (item.id === data.user?.id ? data.user : item))
      );
      setMessage({ type: "success", text: "用户信息已更新。" });
    } catch {
      setMessage({ type: "error", text: "用户更新失败，请稍后重试。" });
    }
  }

  function patchLocalUser(userId: string, patch: Partial<AdminUser>) {
    setUsers((items) =>
      items.map((item) => (item.id === userId ? { ...item, ...patch } : item))
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-6 text-[#172033]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8dee8] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase text-[#2d7180]">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">
              用户数据管理
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              className="rounded-md border border-[#c7d0dc] bg-white px-3 py-2 text-sm font-semibold text-[#354256]"
              href="/"
            >
              返回工作台
            </Link>
            <button
              className="rounded-md bg-[#2d7180] px-3 py-2 text-sm font-semibold text-white"
              onClick={loadUsers}
              type="button"
            >
              刷新
            </button>
          </div>
        </div>

        {message ? (
          <div
            className={`mt-4 rounded-md border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-[#b7d7c4] bg-[#f1fbf5] text-[#276749]"
                : "border-[#f3b8b8] bg-[#fff5f5] text-[#b42318]"
            }`}
            role="status"
          >
            {message.text}
          </div>
        ) : null}

        <section className="mt-5 overflow-x-auto rounded-lg border border-[#d8dee8] bg-white">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="bg-[#f4f7f9] text-[#516070]">
              <tr>
                <th className="px-4 py-3 font-semibold">邮箱</th>
                <th className="px-4 py-3 font-semibold">角色</th>
                <th className="px-4 py-3 font-semibold">状态</th>
                <th className="px-4 py-3 font-semibold">Token 余额</th>
                <th className="px-4 py-3 font-semibold">最后登录</th>
                <th className="px-4 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-center text-[#657184]" colSpan={6}>
                    正在加载用户数据...
                  </td>
                </tr>
              ) : null}
              {!loading && users.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-[#657184]" colSpan={6}>
                    暂无用户数据。
                  </td>
                </tr>
              ) : null}
              {users.map((user) => (
                <tr className="border-t border-[#edf0f4]" key={user.id}>
                  <td className="px-4 py-3 font-medium text-[#172033]">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-[#c7d0dc] px-2 py-2"
                      onChange={(event) =>
                        patchLocalUser(user.id, {
                          role: event.target.value as AdminUser["role"]
                        })
                      }
                      value={user.role}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-[#c7d0dc] px-2 py-2"
                      onChange={(event) =>
                        patchLocalUser(user.id, {
                          status: event.target.value as AdminUser["status"]
                        })
                      }
                      value={user.status}
                    >
                      <option value="active">active</option>
                      <option value="disabled">disabled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-32 rounded-md border border-[#c7d0dc] px-2 py-2"
                      min={0}
                      onChange={(event) =>
                        patchLocalUser(user.id, {
                          balanceTokens: Number(event.target.value)
                        })
                      }
                      type="number"
                      value={user.balanceTokens}
                    />
                  </td>
                  <td className="px-4 py-3 text-[#657184]">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString("zh-CN")
                      : "未记录"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="rounded-md bg-[#172033] px-3 py-2 text-sm font-semibold text-white"
                      onClick={() => updateUser(user)}
                      type="button"
                    >
                      保存
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
