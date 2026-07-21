"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import React from "react";
import { useState } from "react";

import type { PlanningReport } from "@/lib/planning/schema";

const exports = [
  {
    endpoint: "/api/export/pdf",
    extension: "pdf",
    label: "PDF",
    Icon: FileText
  },
  {
    endpoint: "/api/export/docx",
    extension: "docx",
    label: "Word",
    Icon: FileText
  },
  {
    endpoint: "/api/export/xlsx",
    extension: "xlsx",
    label: "Excel",
    Icon: FileSpreadsheet
  }
] as const;

export function ExportBar({ report }: { report: PlanningReport }) {
  const [activeExport, setActiveExport] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function download(endpoint: string, extension: string) {
    setActiveExport(extension);
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report })
      });

      if (!response.ok) {
        setError("导出失败");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = buildFileName(report.title, extension);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("导出失败");
    } finally {
      setActiveExport(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {exports.map(({ Icon, endpoint, extension, label }) => (
        <button
          className="flex min-h-10 items-center gap-2 rounded-md border border-[#c7d0dc] bg-white px-3 py-2 text-sm font-medium text-[#172033] transition hover:border-[#2d7180] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={activeExport !== null}
          key={label}
          onClick={() => void download(endpoint, extension)}
          title={`导出 ${label}`}
          type="button"
        >
          {activeExport === extension ? (
            <Download aria-hidden="true" size={16} />
          ) : (
            <Icon aria-hidden="true" size={16} />
          )}
          导出 {label}
        </button>
      ))}
      {error ? (
        <span className="basis-full text-right text-xs text-[#b42318]">{error}</span>
      ) : null}
    </div>
  );
}

function buildFileName(title: string, extension: string) {
  const safeTitle = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 48);
  const date = new Date().toISOString().slice(0, 10);

  return `${safeTitle || "enterprise-planning-report"}-${date}.${extension}`;
}
