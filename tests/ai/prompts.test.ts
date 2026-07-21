import { describe, expect, it } from "vitest";

import {
  buildFollowUpPrompt,
  buildPlanningPrompt
} from "../../src/lib/ai/prompts";

const planningInput = {
  productName: "智能门店运营平台",
  description: "为连锁零售企业提供库存预测、门店排班和促销分析的一体化平台。",
  productTypes: ["saas"],
  industries: ["retail"],
  currentStage: "prototype",
  businessModels: ["subscription"],
  targetMarkets: ["china"],
  userProfiles: ["operations_manager"],
  launchPlatforms: ["web"],
  budgetRange: "budget_500k_1m",
  technicalFeatures: ["analytics_dashboard"],
  teamResources: ["product_manager"],
  promotionChannels: ["industry_events"],
  customNotes: "优先服务华东区域已有门店客户。"
};

describe("buildPlanningPrompt", () => {
  it("requires three planning perspectives and the report board schema", () => {
    const prompt = buildPlanningPrompt({
      input: planningInput,
      knowledgeContext: "竞品调研显示，库存预测是首要付费点。"
    });

    expect(prompt).toContain("保守落地型");
    expect(prompt).toContain("增长扩张型");
    expect(prompt).toContain("风险评估型");
    expect(prompt).toContain("costs");
    expect(prompt).toContain("launches");
    expect(prompt).toContain("recruitments");
    expect(prompt).toContain("promotions");
    expect(prompt).toContain("tasks");
  });

  it("requires executive decision, generated timestamp, and source notes details", () => {
    const prompt = buildPlanningPrompt({
      input: planningInput
    });

    expect(prompt).toContain("executiveDecision");
    expect(prompt).toContain("generatedAt");
    expect(prompt).toContain("ISO");
    expect(prompt).toContain("sourceNotes");
  });
});

describe("buildFollowUpPrompt", () => {
  it("references the user's question and report title", () => {
    const prompt = buildFollowUpPrompt({
      question: "预算还能再压缩吗？",
      reportTitle: "智能门店运营平台规划报告",
      reportJson: { title: "智能门店运营平台规划报告", boards: { costs: [] } }
    });

    expect(prompt).toContain("预算还能再压缩吗？");
    expect(prompt).toContain("智能门店运营平台规划报告");
  });
});
