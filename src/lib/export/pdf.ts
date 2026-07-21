import PDFDocument from "pdfkit";
import { existsSync } from "node:fs";
import path from "node:path";

import unicodeRanges from "@fontsource/noto-sans-sc/unicode.json";
import type {
  ExecutiveDecision,
  PlanningReport,
  ReportSection
} from "@/lib/planning/schema";

type TextOptions = Parameters<PDFKit.PDFDocument["text"]>[1];

const fontPackageFilesPath = path.join(
  process.cwd(),
  "node_modules",
  "@fontsource",
  "noto-sans-sc",
  "files"
);
const systemFontFallbackPaths = [
  "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
  "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
  "/Library/Fonts/NotoSansCJK-Regular.ttc",
  "/System/Library/Fonts/STHeiti Medium.ttc"
];
const unicodeRangeEntries = Object.entries(unicodeRanges)
  .map(([rangeKey, rangeValue]) => ({
    fontKey: rangeKey.replace(/^\[|\]$/g, ""),
    ranges: parseUnicodeRange(rangeValue)
  }))
  .filter(({ fontKey }) => fontKey !== "latin" && fontKey !== "latin-ext");
const registeredFontsByDocument = new WeakMap<PDFKit.PDFDocument, Set<string>>();

export async function buildPdfReport(report: PlanningReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    try {
      registerReportFont(doc);
      writeTitle(doc, report);
      writeExecutiveDecision(doc, report.executiveDecision);
      writeSections(doc, report.sections);
      writeSourceNotes(doc, report.sourceNotes);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function registerReportFont(doc: PDFKit.PDFDocument) {
  doc.font("Helvetica");
}

export function getReportFontPath(): string {
  const shardPath = getFontPathForCodePoint("规".codePointAt(0) || 0);

  if (shardPath) {
    return shardPath;
  }

  const systemFallback = systemFontFallbackPaths.find((fontPath) =>
    existsSync(fontPath)
  );

  if (systemFallback) {
    return systemFallback;
  }

  throw new Error("No compatible Chinese font found for PDF export.");
}

export function getReportFontPathsForText(text: string): string[] {
  const fontPaths = new Set<string>();

  for (const character of text) {
    const fontPath = getFontPathForCodePoint(character.codePointAt(0) || 0);

    if (fontPath) {
      fontPaths.add(fontPath);
    }
  }

  return [...fontPaths];
}

export function getUnsupportedPortableFontCharacters(text: string): string[] {
  const unsupportedCharacters = new Set<string>();

  for (const character of text) {
    const codePoint = character.codePointAt(0) || 0;

    if (codePoint > 0xff && !getFontPathForCodePoint(codePoint)) {
      unsupportedCharacters.add(character);
    }
  }

  return [...unsupportedCharacters];
}

function writeTitle(doc: PDFKit.PDFDocument, report: PlanningReport) {
  doc.fontSize(20);
  writePortableText(doc, report.title, { align: "center" });
  doc
    .moveDown(0.5)
    .fontSize(10)
    .fillColor("#4b5563");
  writePortableText(doc, `生成时间：${formatDateTime(report.generatedAt)}`, {
    align: "center"
  });
  doc
    .fillColor("#111827")
    .moveDown(1.2);
}

function writeExecutiveDecision(
  doc: PDFKit.PDFDocument,
  decision: ExecutiveDecision
) {
  writeHeading(doc, "执行决策");
  writeLine(doc, "建议", decision.recommendation);
  writeLine(doc, "首发版本", decision.firstLaunchVersion);
  writeLine(doc, "成本区间", decision.estimatedCostRange);
  writeLine(doc, "预计周期", decision.estimatedTimeline);
  writeLine(doc, "核心用户", decision.coreUsers.join("、"));
  writeLine(doc, "优先平台", decision.priorityPlatforms.join("、"));
  writeLine(doc, "主要风险", decision.mainRisks.join("、"));
  writeLine(doc, "推荐团队", decision.recommendedTeam.join("、"));
  writeLine(doc, "推广路径", decision.recommendedPromotionPath.join("、"));
  doc.moveDown();
}

function writeSections(doc: PDFKit.PDFDocument, sections: ReportSection[]) {
  writeHeading(doc, "规划章节");

  sections.forEach((section, index) => {
    doc.fontSize(13);
    writePortableText(doc, `${index + 1}. ${section.title}`);
    doc.moveDown(0.25).fontSize(10);
    writePortableText(doc, section.summary);
    doc.moveDown(0.25);
    writeLine(doc, "保守视角", section.perspectives.conservative);
    writeLine(doc, "增长视角", section.perspectives.growth);
    writeLine(doc, "风险视角", section.perspectives.risk);
    writeLine(doc, "行动项", section.actions.join("；"));
    doc.moveDown(0.6);
  });
}

function writeSourceNotes(doc: PDFKit.PDFDocument, sourceNotes: string[]) {
  writeHeading(doc, "来源说明");
  sourceNotes.forEach((note) => {
    doc.fontSize(9);
    writePortableText(doc, `• ${note}`);
    doc.moveDown(0.2);
  });
}

function writeHeading(doc: PDFKit.PDFDocument, text: string) {
  doc.fontSize(15);
  writePortableText(doc, text);
  doc.moveDown(0.4);
}

function writeLine(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.fontSize(10);
  writePortableText(doc, `${label}：${value}`, { lineGap: 2 });
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai"
  }).format(new Date(value));
}

function writePortableText(
  doc: PDFKit.PDFDocument,
  text: string,
  options: TextOptions = {}
) {
  const runs = splitTextByFont(text);

  runs.forEach((run, index) => {
    applyFont(doc, run.fontKey);
    doc.text(run.text, {
      ...options,
      continued: index < runs.length - 1
    });
  });
}

function applyFont(doc: PDFKit.PDFDocument, fontKey: string) {
  if (fontKey === "Helvetica") {
    doc.font("Helvetica");
    return;
  }

  const fontName = `ReportFont-${fontKey}`;

  try {
    const registeredFonts = getRegisteredFonts(doc);

    if (!registeredFonts.has(fontName)) {
      doc.registerFont(fontName, getFontPath(fontKey));
      registeredFonts.add(fontName);
    }

    doc.font(fontName);
  } catch {
    const fallbackPath = systemFontFallbackPaths.find((fontPath) =>
      existsSync(fontPath)
    );

    if (fallbackPath) {
      const registeredFonts = getRegisteredFonts(doc);

      if (!registeredFonts.has("ReportSystemFallback")) {
        doc.registerFont("ReportSystemFallback", fallbackPath);
        registeredFonts.add("ReportSystemFallback");
      }

      doc.font("ReportSystemFallback");
      return;
    }

    doc.font("Helvetica");
  }
}

function getRegisteredFonts(doc: PDFKit.PDFDocument): Set<string> {
  const registeredFonts = registeredFontsByDocument.get(doc) || new Set<string>();

  if (!registeredFontsByDocument.has(doc)) {
    registeredFontsByDocument.set(doc, registeredFonts);
  }

  return registeredFonts;
}

function splitTextByFont(text: string): Array<{ fontKey: string; text: string }> {
  const runs: Array<{ fontKey: string; text: string }> = [];

  for (const character of text) {
    const codePoint = character.codePointAt(0) || 0;
    const fontKey = getFontKeyForCodePoint(codePoint);
    const previousRun = runs[runs.length - 1];

    if (previousRun?.fontKey === fontKey) {
      previousRun.text += character;
    } else {
      runs.push({ fontKey, text: character });
    }
  }

  return runs;
}

function getFontKeyForCodePoint(codePoint: number): string {
  if (codePoint <= 0xff) {
    return "Helvetica";
  }

  return (
    unicodeRangeEntries.find(({ ranges }) =>
      ranges.some(([start, end]) => codePoint >= start && codePoint <= end)
    )?.fontKey || "Helvetica"
  );
}

function getFontPathForCodePoint(codePoint: number): string | null {
  const fontKey = getFontKeyForCodePoint(codePoint);

  if (fontKey === "Helvetica") {
    return null;
  }

  const fontPath = getFontPath(fontKey);

  return existsSync(fontPath) ? fontPath : null;
}

function getFontPath(fontKey: string): string {
  return path.join(
    fontPackageFilesPath,
    `noto-sans-sc-${fontKey}-400-normal.woff`
  );
}

function parseUnicodeRange(rangeValue: string): Array<[number, number]> {
  return rangeValue.split(",").map((range) => {
    const [start, end] = range
      .replace(/^U\+/i, "")
      .split("-")
      .map((value) => Number.parseInt(value, 16));

    return [start, end || start];
  });
}
