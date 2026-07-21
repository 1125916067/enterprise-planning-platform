// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";
import JSZip from "jszip";

import { demoReport } from "../../src/lib/planning/demo-data";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.doUnmock("@/lib/export/pdf");
  vi.resetModules();
});

describe("report exporters", () => {
  it("builds a PDF report buffer from structured report data", async () => {
    const {
      buildPdfReport,
      getReportFontPath,
      getReportFontPathsForText,
      getUnsupportedPortableFontCharacters
    } = await import("../../src/lib/export/pdf");

    const startedAt = performance.now();
    const buffer = await buildPdfReport(demoReport);
    const durationMs = performance.now() - startedAt;
    const fontPath = getReportFontPath();
    const reportFontPaths = getReportFontPathsForText(
      JSON.stringify(demoReport)
    );
    const unsupportedCharacters = getUnsupportedPortableFontCharacters(
      JSON.stringify(demoReport)
    );

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.byteLength).toBeGreaterThan(100);
    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(fontPath).toContain("node_modules");
    expect(fontPath).not.toContain("/System/Library/Fonts");
    expect(fontPath).not.toContain("chinese-simplified-400-normal");
    expect(reportFontPaths.length).toBeGreaterThan(0);
    expect(unsupportedCharacters).toEqual([]);
    expect(reportFontPaths.every((path) => path.includes("node_modules"))).toBe(
      true
    );
    expect(
      reportFontPaths.every(
        (path) => !path.includes("chinese-simplified-400-normal")
      )
    ).toBe(true);
    // The previous monolithic WOFF path measured around 36s on this machine.
    // This threshold is intentionally loose enough for CI variance while catching that regression.
    expect(durationMs).toBeLessThan(5000);
  });

  it("builds a Word report buffer from structured report data", async () => {
    const { buildDocxReport } = await import("../../src/lib/export/docx");

    const buffer = await buildDocxReport(demoReport);
    const documentText = await extractDocxDocumentText(buffer);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.byteLength).toBeGreaterThan(100);
    expect(buffer.subarray(0, 2).toString("utf8")).toBe("PK");
    expect(documentText).toContain(demoReport.title);
    expect(documentText).toContain("执行决策");
    expect(documentText).toContain(demoReport.executiveDecision.recommendation);
    expect(documentText).toContain(demoReport.sections[0].title);
    expect(documentText).toContain("来源说明");
    expect(documentText).toContain(demoReport.sourceNotes[0]);
  });

  it("builds an Excel workbook with the required planning board sheets", async () => {
    const { buildXlsxWorkbook } = await import("../../src/lib/export/xlsx");

    const buffer = await buildXlsxWorkbook(demoReport);
    const workbook = await readSimpleXlsx(buffer);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.byteLength).toBeGreaterThan(100);
    expect(workbook.sheetNames).toEqual([
      "成本表",
      "上线流程",
      "招聘表",
      "推广表",
      "任务表"
    ]);

    const costSheet = workbook.sheets["成本表"];
    const launchSheet = workbook.sheets["上线流程"];
    const taskSheet = workbook.sheets["任务表"];

    expect(costSheet[0]).toEqual(["类别", "项目", "预算估算", "时间", "负责人", "依据"]);
    expect(costSheet[1][0]).toBe(demoReport.boards.costs[0].category);
    expect(costSheet[1][1]).toBe(demoReport.boards.costs[0].item);
    expect(costSheet[1][2]).toBe(demoReport.boards.costs[0].estimate);
    expect(costSheet[1][4]).toBe(demoReport.boards.costs[0].owner);
    expect(launchSheet[0]).toEqual(["阶段", "时间范围", "平台", "目标", "成功指标"]);
    expect(launchSheet[1][0]).toBe(demoReport.boards.launches[0].phase);
    expect(launchSheet[1][2]).toBe(demoReport.boards.launches[0].platform);
    expect(launchSheet[1][4]).toBe(demoReport.boards.launches[0].successMetric);
    expect(taskSheet[0]).toEqual(["里程碑", "任务", "负责人", "截止时间", "状态"]);
    expect(taskSheet[1][0]).toBe(demoReport.boards.tasks[0].milestone);
    expect(taskSheet[1][1]).toBe(demoReport.boards.tasks[0].task);
    expect(taskSheet[1][4]).toBe(demoReport.boards.tasks[0].status);
  });
});

async function extractDocxDocumentText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file("word/document.xml")?.async("string");

  if (!documentXml) {
    throw new Error("DOCX document XML is missing.");
  }

  return [...documentXml.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)]
    .map((match) => decodeXmlText(match[1]))
    .join("");
}

function decodeXmlText(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

async function readSimpleXlsx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const workbookXml = await zip.file("xl/workbook.xml")?.async("string");

  if (!workbookXml) {
    throw new Error("XLSX workbook XML is missing.");
  }

  const sheetNames = [...workbookXml.matchAll(/<sheet\b[^>]*name="([^"]+)"/g)].map(
    (match) => decodeXmlText(match[1])
  );
  const sheets: Record<string, string[][]> = {};

  await Promise.all(
    sheetNames.map(async (sheetName, index) => {
      const sheetXml = await zip.file(`xl/worksheets/sheet${index + 1}.xml`)?.async("string");
      if (!sheetXml) {
        throw new Error(`XLSX worksheet ${index + 1} XML is missing.`);
      }
      sheets[sheetName] = parseWorksheetRows(sheetXml);
    })
  );

  return { sheetNames, sheets };
}

function parseWorksheetRows(sheetXml: string) {
  return [...sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) =>
    [...rowMatch[1].matchAll(/<c\b[^>]*>([\s\S]*?)<\/c>/g)].map((cellMatch) =>
      decodeXmlText(cellMatch[1].match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] || "")
    )
  );
}

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
