import { afterEach, describe, expect, it, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";

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

const knowledgeFile = path.join(process.cwd(), ".local-data", "knowledge.json");
const billingFile = path.join(process.cwd(), ".local-data", "billing.json");
const usersFile = path.join(process.cwd(), ".local-data", "users.json");
const sessionsFile = path.join(process.cwd(), ".local-data", "sessions.json");

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
  afterEach(async () => {
    await fs.rm(knowledgeFile, { force: true });
    await fs.rm(billingFile, { force: true });
    await fs.rm(usersFile, { force: true });
    await fs.rm(sessionsFile, { force: true });
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns a report when DeepSeek output already matches the schema", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(validReport) } }]
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    const cookie = await createAuthCookie("report-user");

    const { POST } = await import("../../src/app/api/report/route");
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ input: validPlanningInput })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ report: validReport });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("includes stored knowledge records in the planning prompt", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    await writeBillingLedger("knowledge-paid-user", 10000);
    const cookie = await createAuthCookie("knowledge-paid-user");
    await fs.mkdir(path.dirname(knowledgeFile), { recursive: true });
    await fs.writeFile(
      knowledgeFile,
      JSON.stringify([
        {
          id: "old",
          fileName: "old-notes.txt",
          extractedText: "旧资料不应进入最近五条。",
          createdAt: "2026-07-21T07:00:00.000Z"
        },
        ...Array.from({ length: 5 }, (_, index) => ({
          id: `recent-${index}`,
          fileName: `recent-${index}.md`,
          extractedText: `近期知识 ${index} ${"x".repeat(4100)}`,
          createdAt: `2026-07-21T${String(index + 8).padStart(2, "0")}:00:00.000Z`
        }))
      ]),
      "utf8"
    );
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(validReport) } }]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("../../src/app/api/report/route");
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({
          input: validPlanningInput,
          knowledgeContext: "请求内上下文"
        })
      })
    );

    expect(response.status).toBe(200);
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const prompt = requestBody.messages[1].content as string;

    expect(prompt).toContain("请求内上下文\n\n文件：recent-4.md");
    expect(prompt).toContain("文件：recent-0.md\n近期知识 0");
    expect(prompt).not.toContain("old-notes.txt");
    expect(prompt).not.toContain("x".repeat(4001));
  });

  it("returns setup guidance when the DeepSeek key is missing", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    const cookie = await createAuthCookie("missing-key-user");

    const { POST } = await import("../../src/app/api/report/route");
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ input: validPlanningInput })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("DEEPSEEK_API_KEY");
    expect(payload.error).toContain(".env.local");
  });

  it("returns 400 for invalid planning input without calling DeepSeek", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const cookie = await createAuthCookie("invalid-input-user");

    const { POST } = await import("../../src/app/api/report/route");
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({
          input: { ...validPlanningInput, productName: "" }
        })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("请求参数无效，请检查规划输入后重试。");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires login before generating a report", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("../../src/app/api/report/route");
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({ input: validPlanningInput })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toContain("请先登录");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 402 without calling DeepSeek when report token balance is insufficient", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await writeBillingLedger("low-report-balance", 1);
    const cookie = await createAuthCookie("low-report-balance");

    const { POST } = await import("../../src/app/api/report/route");
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ input: validPlanningInput })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(402);
    expect(payload.error).toContain("token 余额不足");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a sanitized 500 when DeepSeek fails upstream", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-secret-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: "Invalid token test-secret-key" }
        })
      })
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const cookie = await createAuthCookie("upstream-fail-user");

    const { POST } = await import("../../src/app/api/report/route");
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ input: validPlanningInput })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("生成规划报告失败，请稍后重试。");
    expect(payload.error).not.toContain("test-secret-key");
    expect(payload.error).not.toContain("Invalid token");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("repairs invalid AI report output and returns the repaired report", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ title: "不完整报告" }) } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(validReport) } }]
        })
      });
    vi.stubGlobal("fetch", fetchMock);
    const cookie = await createAuthCookie("repair-user");

    const { POST } = await import("../../src/app/api/report/route");
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ input: validPlanningInput })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ report: validReport });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns 502 when repaired AI output still fails report validation", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    const invalidRepairedReport = {
      ...validReport,
      sections: validReport.sections.slice(0, 7)
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ title: "不完整报告" }) } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(invalidRepairedReport) } }]
        })
      });
    vi.stubGlobal("fetch", fetchMock);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const cookie = await createAuthCookie("invalid-repair-user");

    const { POST } = await import("../../src/app/api/report/route");
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ input: validPlanningInput })
      })
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "AI 返回内容格式不符合要求，请重试。"
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON requests", async () => {
    const cookie = await createAuthCookie("malformed-report-user");
    const { POST } = await import("../../src/app/api/report/route");
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        headers: { Cookie: cookie },
        body: "{"
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "请求 JSON 格式无效，请检查后重试。"
    });
  });
});

describe("POST /api/chat", () => {
  afterEach(async () => {
    await fs.rm(billingFile, { force: true });
    await fs.rm(usersFile, { force: true });
    await fs.rm(sessionsFile, { force: true });
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns an answer for a valid follow-up question", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "建议先压缩试点范围。" } }]
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    const cookie = await createAuthCookie("chat-user");

    const { POST } = await import("../../src/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({
          question: "预算还能再压缩吗？",
          report: validReport
        })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      answer: "建议先压缩试点范围。"
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("returns setup guidance when the DeepSeek key is missing", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    const cookie = await createAuthCookie("chat-missing-key-user");

    const { POST } = await import("../../src/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({
          question: "预算还能再压缩吗？",
          report: validReport
        })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("DEEPSEEK_API_KEY");
    expect(payload.error).toContain(".env.local");
  });

  it("requires a non-empty question", async () => {
    const cookie = await createAuthCookie("empty-question-user");
    const { POST } = await import("../../src/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({ question: "   ", report: validReport })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("question");
  });

  it("returns 400 for an invalid report", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const cookie = await createAuthCookie("invalid-chat-report-user");

    const { POST } = await import("../../src/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({
          question: "预算还能再压缩吗？",
          report: { ...validReport, sections: [] }
        })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "report 无效，请检查报告内容后重试。"
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 402 without calling DeepSeek when chat token balance is insufficient", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await writeBillingLedger("low-chat-balance", 1);
    const cookie = await createAuthCookie("low-chat-balance");

    const { POST } = await import("../../src/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { Cookie: cookie },
        body: JSON.stringify({
          question: "预算还能再压缩吗？",
          report: validReport
        })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(402);
    expect(payload.error).toContain("token 余额不足");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON requests", async () => {
    const cookie = await createAuthCookie("malformed-chat-user");
    const { POST } = await import("../../src/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { Cookie: cookie },
        body: "{"
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "请求 JSON 格式无效，请检查后重试。"
    });
  });
});

async function writeBillingLedger(userId: string, balanceTokens: number) {
  await fs.mkdir(path.dirname(billingFile), { recursive: true });
  await fs.writeFile(
    billingFile,
    JSON.stringify({
      accounts: [
        {
          userId,
          balanceTokens,
          grantedTrialTokens: 500,
          createdAt: "2026-07-22T00:00:00.000Z",
          updatedAt: "2026-07-22T00:00:00.000Z"
        }
      ],
      paymentRequests: [],
      charges: []
    }),
    "utf8"
  );
}

async function createAuthCookie(userId: string, email = `${userId}@example.com`) {
  await fs.mkdir(path.dirname(usersFile), { recursive: true });
  await fs.writeFile(
    usersFile,
    JSON.stringify({
      users: [
        {
          id: userId,
          email,
          role: "user",
          status: "active",
          createdAt: "2026-07-22T00:00:00.000Z",
          updatedAt: "2026-07-22T00:00:00.000Z"
        }
      ]
    }),
    "utf8"
  );
  await fs.writeFile(
    sessionsFile,
    JSON.stringify({
      sessions: [
        {
          token: `${userId}-session`,
          userId,
          createdAt: "2026-07-22T00:00:00.000Z",
          expiresAt: "2099-01-01T00:00:00.000Z"
        }
      ]
    }),
    "utf8"
  );

  return `auth_session=${userId}-session`;
}
