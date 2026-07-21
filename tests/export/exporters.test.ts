import { afterEach, describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";

import { demoReport } from "../../src/lib/planning/demo-data";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.doUnmock("@/lib/export/pdf");
  vi.resetModules();
});

describe("report exporters", () => {
  it("builds a PDF report buffer from structured report data", async () => {
    const { buildPdfReport, getReportFontPath } = await import(
      "../../src/lib/export/pdf"
    );

    const buffer = await buildPdfReport(demoReport);
    const fontPath = getReportFontPath();

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.byteLength).toBeGreaterThan(100);
    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(fontPath).toContain("node_modules");
    expect(fontPath).not.toContain("/System/Library/Fonts");
  });

  it("builds a Word report buffer from structured report data", async () => {
    const { buildDocxReport } = await import("../../src/lib/export/docx");

    const buffer = await buildDocxReport(demoReport);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.byteLength).toBeGreaterThan(100);
    expect(buffer.subarray(0, 2).toString("utf8")).toBe("PK");
  });

  it("builds an Excel workbook with the required planning board sheets", async () => {
    const { buildXlsxWorkbook } = await import("../../src/lib/export/xlsx");

    const buffer = await buildXlsxWorkbook(demoReport);
    const workbook = XLSX.read(buffer, { type: "buffer" });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.byteLength).toBeGreaterThan(100);
    expect(workbook.SheetNames).toEqual([
      "成本表",
      "上线流程",
      "招聘表",
      "推广表",
      "任务表"
    ]);

    const costRows = XLSX.utils.sheet_to_json<Record<string, string>>(
      workbook.Sheets["成本表"]
    );
    const launchRows = XLSX.utils.sheet_to_json<Record<string, string>>(
      workbook.Sheets["上线流程"]
    );
    const taskRows = XLSX.utils.sheet_to_json<Record<string, string>>(
      workbook.Sheets["任务表"]
    );

    expect(costRows[0]).toMatchObject({
      类别: demoReport.boards.costs[0].category,
      项目: demoReport.boards.costs[0].item,
      预算估算: demoReport.boards.costs[0].estimate,
      负责人: demoReport.boards.costs[0].owner
    });
    expect(launchRows[0]).toMatchObject({
      阶段: demoReport.boards.launches[0].phase,
      平台: demoReport.boards.launches[0].platform,
      成功指标: demoReport.boards.launches[0].successMetric
    });
    expect(taskRows[0]).toMatchObject({
      里程碑: demoReport.boards.tasks[0].milestone,
      任务: demoReport.boards.tasks[0].task,
      状态: demoReport.boards.tasks[0].status
    });
  });
});

describe("export API routes", () => {
  it("returns a PDF download response", async () => {
    vi.doMock("@/lib/export/pdf", () => ({
      buildPdfReport: async () => Buffer.from(`%PDF-1.7\n${"x".repeat(120)}`)
    }));
    const { POST } = await import("../../src/app/api/export/pdf/route");

    const response = await POST(
      new Request("http://localhost/api/export/pdf", {
        method: "POST",
        body: JSON.stringify({ report: demoReport })
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="enterprise-planning-report.pdf"'
    );
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(100);
  });

  it("returns a Word download response", async () => {
    const { POST } = await import("../../src/app/api/export/docx/route");

    const response = await POST(
      new Request("http://localhost/api/export/docx", {
        method: "POST",
        body: JSON.stringify({ report: demoReport })
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="enterprise-planning-report.docx"'
    );
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(100);
  });

  it("returns an Excel download response", async () => {
    const { POST } = await import("../../src/app/api/export/xlsx/route");

    const response = await POST(
      new Request("http://localhost/api/export/xlsx", {
        method: "POST",
        body: JSON.stringify({ report: demoReport })
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="enterprise-planning-boards.xlsx"'
    );
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(100);
  });

  it("returns 400 for an invalid report payload", async () => {
    const { POST } = await import("../../src/app/api/export/pdf/route");

    const response = await POST(
      new Request("http://localhost/api/export/pdf", {
        method: "POST",
        body: JSON.stringify({ report: { ...demoReport, sections: [] } })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "报告数据无效，请检查后重试。"
    });
  });
});
