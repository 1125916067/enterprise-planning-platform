"use client";

import React from "react";
import { useState } from "react";

import type { PlanningInput, PlanningReport } from "@/lib/planning/schema";

import { AssistantPanel } from "./AssistantPanel";
import { ExportBar } from "./ExportBar";
import { ProductIntakeForm } from "./ProductIntakeForm";
import { ReportView } from "./ReportView";
import { StructuredBoards } from "./StructuredBoards";

export function PlanningWorkspace() {
  const [report, setReport] = useState<PlanningReport | null>(null);
  const [input, setInput] = useState<PlanningInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate(nextInput: PlanningInput) {
    setLoading(true);
    setError("");
    setInput(nextInput);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: nextInput })
      });
      const data = (await response.json()) as {
        report?: PlanningReport;
        error?: string;
      };

      if (!response.ok || !data.report) {
        setError(data.error ?? "生成报告失败，请检查输入后重试。");
        return;
      }

      setReport(data.report);
    } catch {
      setError("网络请求失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#172033]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1760px] grid-cols-1 gap-4 px-4 py-4 xl:grid-cols-[400px_minmax(0,1fr)_360px]">
        <ProductIntakeForm loading={loading} onGenerate={generate} />

        <section className="min-w-0">
          <div className="sticky top-0 z-10 border-b border-[#d8dee8] bg-[#f7f8fa]/95 px-1 py-3 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-[#2d7180]">
                  Planning Report
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-normal text-[#172033]">
                  企业规划报告
                </h1>
              </div>
              {report ? <ExportBar report={report} /> : null}
            </div>
          </div>

          <div className="py-4">
            {error ? (
              <div
                className="mb-4 rounded-md border border-[#f3b8b8] bg-[#fff5f5] px-4 py-3 text-sm leading-6 text-[#b42318]"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="mb-4 rounded-md border border-[#b8c8ee] bg-[#eef4ff] px-4 py-3 text-sm font-medium text-[#2f5597]">
                正在生成报告...
              </div>
            ) : null}

            {report ? (
              <div className="space-y-5">
                <ReportView report={report} />
                <StructuredBoards report={report} />
              </div>
            ) : (
              <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-[#c7d0dc] bg-white px-6 text-center text-sm leading-7 text-[#516070]">
                请先在左侧填写产品信息。系统会生成决策摘要、执行方案、成本规划、招聘方案和推广看板。
              </div>
            )}
          </div>
        </section>

        <AssistantPanel input={input} report={report} />
      </div>
    </main>
  );
}
