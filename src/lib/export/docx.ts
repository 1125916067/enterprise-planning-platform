import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun
} from "docx";

import type {
  ExecutiveDecision,
  PlanningReport,
  ReportSection
} from "@/lib/planning/schema";

export async function buildDocxReport(report: PlanningReport): Promise<Buffer> {
  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: report.title,
            heading: HeadingLevel.TITLE
          }),
          new Paragraph(`生成时间：${formatDateTime(report.generatedAt)}`),
          spacer(),
          heading("执行决策"),
          ...executiveDecisionParagraphs(report.executiveDecision),
          spacer(),
          heading("规划章节"),
          ...sectionParagraphs(report.sections),
          heading("来源说明"),
          ...report.sourceNotes.map((note) => bullet(note))
        ]
      }
    ]
  });

  return Packer.toBuffer(document);
}

function executiveDecisionParagraphs(decision: ExecutiveDecision): Paragraph[] {
  return [
    labeled("建议", decision.recommendation),
    labeled("首发版本", decision.firstLaunchVersion),
    labeled("成本区间", decision.estimatedCostRange),
    labeled("预计周期", decision.estimatedTimeline),
    labeled("核心用户", decision.coreUsers.join("、")),
    labeled("优先平台", decision.priorityPlatforms.join("、")),
    labeled("主要风险", decision.mainRisks.join("、")),
    labeled("推荐团队", decision.recommendedTeam.join("、")),
    labeled("推广路径", decision.recommendedPromotionPath.join("、"))
  ];
}

function sectionParagraphs(sections: ReportSection[]): Paragraph[] {
  return sections.flatMap((section, index) => [
    new Paragraph({
      text: `${index + 1}. ${section.title}`,
      heading: HeadingLevel.HEADING_2
    }),
    new Paragraph(section.summary),
    labeled("保守视角", section.perspectives.conservative),
    labeled("增长视角", section.perspectives.growth),
    labeled("风险视角", section.perspectives.risk),
    labeled("行动项", section.actions.join("；")),
    spacer()
  ]);
}

function heading(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1 });
}

function labeled(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}：`, bold: true }),
      new TextRun(value)
    ]
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({ text, bullet: { level: 0 } });
}

function spacer(): Paragraph {
  return new Paragraph("");
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai"
  }).format(new Date(value));
}
