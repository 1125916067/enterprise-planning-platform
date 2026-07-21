import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const validPlanningInput = {
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

const validReport = {
  title: "智能门店运营平台规划报告",
  generatedAt: "2026-07-21T08:00:00.000Z",
  executiveDecision: {
    recommendation: "先聚焦库存预测和门店看板，验证续费意愿后扩展排班模块。",
    firstLaunchVersion: "MVP 版本",
    estimatedCostRange: "50万至100万人民币",
    estimatedTimeline: "12至16周",
    coreUsers: ["区域运营经理", "门店店长"],
    priorityPlatforms: ["Web 管理端", "移动端轻应用"],
    mainRisks: ["历史数据质量不足", "门店执行流程差异较大"],
    recommendedTeam: ["产品经理", "全栈工程师", "数据分析师"],
    recommendedPromotionPath: ["行业私域试点", "客户成功案例"]
  },
  sections: Array.from({ length: 8 }, (_, index) => ({
    title: `规划章节 ${index + 1}`,
    summary: "本章节总结关键判断和执行建议。",
    perspectives: {
      conservative: "保守视角下先控制范围并压缩试点成本。",
      growth: "增长视角下用标杆客户案例推动复制。",
      risk: "风险视角下关注数据接入和一线培训。"
    },
    actions: ["完成需求访谈", "确认阶段验收标准"]
  })),
  boards: {
    costs: [
      {
        category: "产品研发",
        item: "MVP 研发",
        estimate: "30万至45万人民币",
        timing: "第1至12周",
        owner: "技术负责人",
        rationale: "覆盖核心功能开发和基础测试。"
      }
    ],
    launches: [
      {
        phase: "试点发布",
        timeframe: "第13至16周",
        platform: "Web 管理端",
        goal: "完成3家门店闭环试点",
        successMetric: "试点门店周活跃率超过70%"
      }
    ],
    recruitments: [
      {
        role: "数据分析师",
        priority: "高",
        timing: "第1个月",
        responsibility: "梳理库存预测指标和数据质量规则",
        hiringType: "外包转长期"
      }
    ],
    promotions: [
      {
        channel: "行业社群",
        audience: "连锁零售运营负责人",
        message: "减少缺货和滞销带来的门店损耗",
        budget: "5万人民币",
        metric: "获取20个有效线索"
      }
    ],
    tasks: [
      {
        milestone: "需求确认",
        task: "完成10位目标用户访谈",
        owner: "产品经理",
        due: "第2周",
        status: "计划中"
      }
    ]
  },
  sourceNotes: ["基于用户输入和通用行业经验生成，无真实客户秘密。"]
};

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports DeepSeek configuration and default model", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");

    const { GET } = await import("../../src/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      deepseekConfigured: false,
      model: "deepseek-chat"
    });
  });
});

describe("POST /api/report", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns setup guidance when the DeepSeek key is missing", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");

    const { POST } = await import("../../src/app/api/report/route");
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({ input: validPlanningInput })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("DEEPSEEK_API_KEY");
    expect(payload.error).toContain(".env.local");
  });
});

describe("POST /api/chat", () => {
  it("requires a non-empty question", async () => {
    const { POST } = await import("../../src/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ question: "   ", report: validReport })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("question");
  });
});
