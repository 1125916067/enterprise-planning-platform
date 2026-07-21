import type { PlanningInput, PlanningReport } from "../planning/schema";

type BuildPlanningPromptParams = {
  input: PlanningInput;
  knowledgeContext?: string;
};

type BuildFollowUpPromptParams = {
  question: string;
  reportTitle: string;
  reportJson: PlanningReport | unknown;
};

const boardSchema = {
  costs: [
    {
      category: "string",
      item: "string",
      estimate: "string",
      timing: "string",
      owner: "string",
      rationale: "string"
    }
  ],
  launches: [
    {
      phase: "string",
      timeframe: "string",
      platform: "string",
      goal: "string",
      successMetric: "string"
    }
  ],
  recruitments: [
    {
      role: "string",
      priority: "string",
      timing: "string",
      responsibility: "string",
      hiringType: "string"
    }
  ],
  promotions: [
    {
      channel: "string",
      audience: "string",
      message: "string",
      budget: "string",
      metric: "string"
    }
  ],
  tasks: [
    {
      milestone: "string",
      task: "string",
      owner: "string",
      due: "string",
      status: "string"
    }
  ]
};

export function buildPlanningPrompt({
  input,
  knowledgeContext
}: BuildPlanningPromptParams): string {
  return [
    "你是一名企业产品与经营规划顾问。请基于用户输入生成严格 JSON，不要输出 Markdown 或解释文字。",
    "每个 narrative section 都必须包含三个 perspectives：保守落地型、增长扩张型、风险评估型。",
    "输出 JSON 顶层字段必须匹配 planningReportSchema：title, generatedAt, executiveDecision, sections, boards, sourceNotes。",
    "executiveDecision 必须是对象，且只包含这些字段：recommendation, firstLaunchVersion, estimatedCostRange, estimatedTimeline, coreUsers, priorityPlatforms, mainRisks, recommendedTeam, recommendedPromotionPath。",
    "generatedAt 必须是当前生成时间的 ISO 8601 datetime 字符串，例如 2026-07-21T09:00:00.000Z。",
    "sourceNotes 必须是字符串数组，逐条说明引用或推断依据；没有外部资料时也要写明基于用户输入和补充知识上下文生成。",
    "sections 至少 8 个，每个 section 包含 title, summary, perspectives, actions。",
    "perspectives 对象使用键 conservative, growth, risk，分别对应保守落地型、增长扩张型、风险评估型。",
    `boards 必须包含这些表格 schema 名称和字段：${JSON.stringify(boardSchema, null, 2)}`,
    "所有建议都要可执行，成本、周期、人员、渠道和风险要写成清晰中文。",
    `用户输入：${JSON.stringify(input, null, 2)}`,
    `补充知识上下文：${knowledgeContext?.trim() || "无"}`
  ].join("\n\n");
}

export function buildFollowUpPrompt({
  question,
  reportTitle,
  reportJson
}: BuildFollowUpPromptParams): string {
  return [
    "你是一名企业规划报告问答助手。请只基于给定报告回答用户追问。",
    "回答必须直接、具体，必要时引用报告中的成本、节奏、风险或任务信息。",
    `报告标题：${reportTitle}`,
    `用户问题：${question}`,
    `报告 JSON：${JSON.stringify(reportJson, null, 2)}`
  ].join("\n\n");
}
