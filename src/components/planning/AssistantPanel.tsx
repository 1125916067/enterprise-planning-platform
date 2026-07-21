"use client";

import { Send } from "lucide-react";
import React from "react";
import { useEffect, useMemo, useState } from "react";

import type { PlanningInput, PlanningReport } from "@/lib/planning/schema";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AssistantPanel({
  input,
  report
}: {
  input: PlanningInput | null;
  report: PlanningReport | null;
}) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const reportKey = useMemo(
    () => (report ? `${report.generatedAt}:${report.title}` : ""),
    [report]
  );

  useEffect(() => {
    setMessages([]);
    setQuestion("");
  }, [reportKey]);

  async function send() {
    const nextQuestion = question.trim();

    if (!report || !nextQuestion || loading) {
      return;
    }

    setQuestion("");
    setMessages((items) => [...items, { role: "user", content: nextQuestion }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: nextQuestion, report })
      });
      const data = (await response.json()) as { answer?: string; error?: string };

      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          content: response.ok
            ? data.answer ?? "暂无回答。"
            : data.error ?? "追问失败，请稍后重试。"
        }
      ]);
    } catch {
      setMessages((items) => [
        ...items,
        { role: "assistant", content: "网络请求失败，请稍后重试。" }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="flex h-auto rounded-lg border border-[#d8dee8] bg-white xl:h-[calc(100vh-32px)] xl:flex-col xl:overflow-hidden">
      <div className="flex min-h-[520px] w-full flex-col p-5">
        <div>
          <p className="text-xs font-semibold uppercase text-[#2d7180]">
            Follow-up
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-[#172033]">
            右侧 AI 追问
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#516070]">
            {report
              ? `当前项目：${input?.productName || report.title}`
              : "生成报告后可以继续细化成本、招聘、平台和推广方案。"}
          </p>
        </div>

        <div className="mt-4 flex-1 space-y-3 overflow-auto pr-1">
          {messages.length === 0 ? (
            <div className="rounded-md bg-[#f4f7f9] px-3 py-3 text-sm leading-6 text-[#657184]">
              {report
                ? "可以追问：如何压缩首版范围、如何安排招聘顺序、或如何调整推广预算。"
                : "等待报告生成后开启追问。"}
            </div>
          ) : null}

          {messages.map((message, index) => (
            <div
              className={`rounded-md px-3 py-3 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-[#e8f1f4] text-[#173f47]"
                  : "bg-[#f4f7f9] text-[#354256]"
              }`}
              key={`${message.role}-${index}`}
            >
              <div className="mb-1 text-xs font-semibold">
                {message.role === "user" ? "你" : "AI 助手"}
              </div>
              {message.content}
            </div>
          ))}

          {loading ? (
            <div className="rounded-md bg-[#f4f7f9] px-3 py-3 text-sm text-[#657184]">
              正在分析...
            </div>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          <textarea
            aria-label="输入追问，例如把服务器成本降到最低，或者改成先做小程序版本"
            className="min-h-24 w-full resize-y rounded-md border border-[#c7d0dc] bg-white px-3 py-2 text-sm leading-6 text-[#172033] outline-none transition focus:border-[#2d7180] focus:ring-2 focus:ring-[#d8edf1] disabled:bg-[#f4f7f9] disabled:text-[#8a95a5]"
            disabled={!report || loading}
            onChange={(event) => setQuestion(event.target.value)}
            value={question}
          />
          <button
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#172033] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#243044] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!report || loading || !question.trim()}
            onClick={send}
            type="button"
          >
            <Send aria-hidden="true" size={18} />
            发送追问
          </button>
        </div>
      </div>
    </aside>
  );
}
