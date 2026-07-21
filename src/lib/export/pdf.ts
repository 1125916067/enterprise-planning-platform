import PDFDocument from "pdfkit";

import type {
  ExecutiveDecision,
  PlanningReport,
  ReportSection
} from "@/lib/planning/schema";

const cjkFontPath = "/System/Library/Fonts/STHeiti Medium.ttc";

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
  try {
    doc.registerFont("ReportFont", cjkFontPath);
    doc.font("ReportFont");
  } catch {
    doc.font("Helvetica");
  }
}

function writeTitle(doc: PDFKit.PDFDocument, report: PlanningReport) {
  doc.fontSize(20).text(report.title, { align: "center" });
  doc
    .moveDown(0.5)
    .fontSize(10)
    .fillColor("#4b5563")
    .text(`生成时间：${formatDateTime(report.generatedAt)}`, { align: "center" })
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
    doc.fontSize(13).text(`${index + 1}. ${section.title}`).moveDown(0.25);
    doc.fontSize(10).text(section.summary).moveDown(0.25);
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
    doc.fontSize(9).text(`• ${note}`).moveDown(0.2);
  });
}

function writeHeading(doc: PDFKit.PDFDocument, text: string) {
  doc.fontSize(15).text(text).moveDown(0.4);
}

function writeLine(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.fontSize(10).text(`${label}：${value}`, { lineGap: 2 });
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai"
  }).format(new Date(value));
}
