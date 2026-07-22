import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { demoReport } from "../../src/lib/planning/demo-data";

const nextDemoReport = {
  ...demoReport,
  title: "供应链协同平台规划报告",
  generatedAt: "2026-07-21T09:00:00.000Z",
  executiveDecision: {
    ...demoReport.executiveDecision,
    recommendation: "建议先聚焦供应商协同、订单状态同步和异常交付提醒。"
  }
};

const billingStatus = {
  account: { balanceTokens: 500 },
  pendingPaymentRequests: [],
  paidPackPriceCny: 5,
  paidPackTokens: 10000,
  freeTrialTokens: 500
};

const testUser = {
  id: "test-user",
  email: "user@example.com",
  role: "user" as const,
  status: "active" as const
};

type MockResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

function jsonResponse(payload: unknown, ok = true): MockResponse {
  return {
    ok,
    json: async () => payload
  };
}

function workspaceFetchMock(
  handlers: Record<string, Array<MockResponse | Promise<MockResponse>>>
) {
  return vi.fn((url: string, _init?: RequestInit) => {
    void _init;

    if (url === "/api/billing/status") {
      return Promise.resolve(jsonResponse(billingStatus));
    }

    const queue = handlers[url];
    const next = queue?.shift();

    if (!next) {
      return Promise.resolve(jsonResponse({ error: `Unhandled ${url}` }, false));
    }

    return Promise.resolve(next);
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PlanningWorkspace", () => {
  it("renders the initial planning workspace", async () => {
    vi.stubGlobal("fetch", workspaceFetchMock({}));
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace user={testUser} />);

    expect(screen.getByText("产品专业输入")).toBeTruthy();
    expect(screen.getByText("企业规划报告")).toBeTruthy();
    expect(screen.getByText("右侧 AI 追问")).toBeTruthy();
    expect(screen.getByText(/请先在左侧填写产品信息/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /导出 PDF/ })).toBeNull();
    expect(screen.getByRole("button", { name: "发送追问" })).toHaveProperty(
      "disabled",
      true
    );
    expect(await screen.findByText(/剩余 token：500/)).toBeTruthy();
  });

  it("submits a payment request from the billing panel", async () => {
    const fetchMock = workspaceFetchMock({
      "/api/billing/payment-requests": [
        jsonResponse(
          {
            paymentRequest: {
              id: "payment-1",
              status: "pending"
            }
          },
          true
        )
      ]
    });
    vi.stubGlobal("fetch", fetchMock);
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace user={testUser} />);
    fireEvent.change(screen.getByLabelText("付款人"), {
      target: { value: "张三" }
    });
    fireEvent.change(screen.getByLabelText("联系方式或微信昵称"), {
      target: { value: "wxid-demo" }
    });
    fireEvent.change(screen.getByLabelText("付款备注/时间"), {
      target: { value: "7月22日 5元" }
    });
    fireEvent.change(screen.getByLabelText("付款凭证"), {
      target: { value: "已通过微信二维码付款" }
    });
    fireEvent.click(screen.getByRole("button", { name: "提交充值申请" }));

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([url]) => url === "/api/billing/payment-requests"
        )
      ).toBe(true)
    );
    expect(
      await screen.findByText(/充值申请已提交，管理员审核后会自动增加 10000 token/)
    ).toBeTruthy();
  });

  it("submits the form to the report API with a valid PlanningInput shape", async () => {
    const fetchMock = workspaceFetchMock({
      "/api/report": [jsonResponse({ report: demoReport })]
    });
    vi.stubGlobal("fetch", fetchMock);
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace user={testUser} />);
    fireEvent.change(screen.getByLabelText("产品名称"), {
      target: { value: "智能门店运营平台" }
    });
    fireEvent.change(screen.getByLabelText("产品简介"), {
      target: {
        value: "为连锁零售团队提供库存预测、经营看板和门店任务协同。"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "生成企业规划报告" }));

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => url === "/api/report")).toBe(
        true
      )
    );
    const reportCall = fetchMock.mock.calls.find(
      ([url]) => url === "/api/report"
    );
    if (!reportCall) {
      throw new Error("Expected /api/report to be called.");
    }
    expect(reportCall?.[1]).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.any(String)
    });
    const requestBody = JSON.parse(String(reportCall[1]?.body));

    expect(requestBody.input).toMatchObject({
      productName: "智能门店运营平台",
      description: "为连锁零售团队提供库存预测、经营看板和门店任务协同。",
      currentStage: expect.any(String),
      budgetRange: expect.any(String),
      customNotes: expect.any(String)
    });
    expect(requestBody.input.productTypes).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(requestBody.input.industries).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(requestBody.input.businessModels).toEqual(
      expect.arrayContaining([expect.any(String)])
    );
    expect(requestBody.input.targetMarkets).toEqual(
      expect.arrayContaining([expect.any(String)])
    );
    expect(requestBody.input.userProfiles).toEqual(
      expect.arrayContaining([expect.any(String)])
    );
    expect(requestBody.input.launchPlatforms).toEqual(
      expect.arrayContaining([expect.any(String)])
    );
    expect(requestBody.input.technicalFeatures).toEqual(
      expect.arrayContaining([expect.any(String)])
    );
    expect(requestBody.input.teamResources).toEqual(
      expect.arrayContaining([expect.any(String)])
    );
    expect(requestBody.input.promotionChannels).toEqual(
      expect.arrayContaining([expect.any(String)])
    );
    expect(await screen.findByText(demoReport.title)).toBeTruthy();
    expect(screen.getByRole("button", { name: /导出 PDF/ })).toBeTruthy();
  });

  it("uploads a knowledge file and shows the success message", async () => {
    const fetchMock = workspaceFetchMock({
      "/api/knowledge/upload": [
        jsonResponse({
          record: { fileName: "research.txt", extractedText: "调研内容" }
        })
      ]
    });
    vi.stubGlobal("fetch", fetchMock);
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace user={testUser} />);
    const file = new File(["调研内容"], "research.txt", { type: "text/plain" });

    fireEvent.change(screen.getByLabelText("上传知识文件"), {
      target: { files: [file] }
    });

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) => url === "/api/knowledge/upload")
      ).toBe(true)
    );
    const uploadCall = fetchMock.mock.calls.find(
      ([url]) => url === "/api/knowledge/upload"
    );
    if (!uploadCall) {
      throw new Error("Expected /api/knowledge/upload to be called.");
    }
    expect(uploadCall?.[1]).toMatchObject({
      method: "POST",
      body: expect.any(FormData)
    });
    const formData = uploadCall[1]?.body as FormData;

    expect(formData.get("file")).toBe(file);
    expect(await screen.findByText("已上传知识文件：research.txt")).toBeTruthy();
  });

  it("shows the API error message when knowledge upload fails", async () => {
    const fetchMock = workspaceFetchMock({
      "/api/knowledge/upload": [
        jsonResponse({ error: "不支持的知识文件类型：zip" }, false)
      ]
    });
    vi.stubGlobal("fetch", fetchMock);
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace user={testUser} />);
    const file = new File(["bad"], "archive.zip", { type: "application/zip" });

    fireEvent.change(screen.getByLabelText("上传知识文件"), {
      target: { files: [file] }
    });

    expect(await screen.findByText("不支持的知识文件类型：zip")).toBeTruthy();
  });

  it("clears the previous report and export controls when a second generation fails", async () => {
    const fetchMock = workspaceFetchMock({
      "/api/report": [
        jsonResponse({ report: demoReport }),
        jsonResponse({ error: "生成规划报告失败，请稍后重试。" }, false)
      ]
    });
    vi.stubGlobal("fetch", fetchMock);
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace user={testUser} />);
    fireEvent.change(screen.getByLabelText("产品名称"), {
      target: { value: "智能门店运营平台" }
    });
    fireEvent.change(screen.getByLabelText("产品简介"), {
      target: {
        value: "为连锁零售团队提供库存预测、经营看板和门店任务协同。"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "生成企业规划报告" }));

    expect(await screen.findByText(demoReport.title)).toBeTruthy();
    expect(screen.getByRole("button", { name: /导出 PDF/ })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("产品名称"), {
      target: { value: "供应链协同平台" }
    });
    fireEvent.click(screen.getByRole("button", { name: "生成企业规划报告" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "生成规划报告失败，请稍后重试。"
    );
    expect(screen.queryByText(demoReport.title)).toBeNull();
    expect(screen.queryByRole("button", { name: /导出 PDF/ })).toBeNull();
    expect(screen.getByText(/请先在左侧填写产品信息/)).toBeTruthy();
  });

  it("keeps assistant disabled before a report and sends messages after report generation", async () => {
    const fetchMock = workspaceFetchMock({
      "/api/report": [jsonResponse({ report: demoReport })],
      "/api/chat": [jsonResponse({ answer: "建议先确认三家试点门店的数据质量。" })]
    });
    vi.stubGlobal("fetch", fetchMock);
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace user={testUser} />);
    const sendButton = screen.getByRole("button", { name: "发送追问" });
    const questionInput = screen.getByLabelText(/输入追问/);

    expect(sendButton).toHaveProperty("disabled", true);
    expect(questionInput).toHaveProperty("disabled", true);

    fireEvent.change(screen.getByLabelText("产品名称"), {
      target: { value: "智能门店运营平台" }
    });
    fireEvent.change(screen.getByLabelText("产品简介"), {
      target: {
        value: "为连锁零售团队提供库存预测、经营看板和门店任务协同。"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "生成企业规划报告" }));

    await screen.findByText(demoReport.title);
    fireEvent.change(questionInput, {
      target: { value: "先做哪些试点准备？" }
    });
    fireEvent.click(sendButton);

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => url === "/api/chat")).toBe(
        true
      )
    );
    const chatCall = fetchMock.mock.calls.find(([url]) => url === "/api/chat");
    expect(chatCall?.[1]).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "先做哪些试点准备？", report: demoReport })
    });
    expect(await screen.findByText("建议先确认三家试点门店的数据质量。")).toBeTruthy();
  });

  it("resets assistant messages when a new report becomes active", async () => {
    const fetchMock = workspaceFetchMock({
      "/api/report": [
        jsonResponse({ report: demoReport }),
        jsonResponse({ report: nextDemoReport })
      ],
      "/api/chat": [jsonResponse({ answer: "第一份报告的追问回答。" })]
    });
    vi.stubGlobal("fetch", fetchMock);
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace user={testUser} />);
    fireEvent.change(screen.getByLabelText("产品名称"), {
      target: { value: "智能门店运营平台" }
    });
    fireEvent.change(screen.getByLabelText("产品简介"), {
      target: {
        value: "为连锁零售团队提供库存预测、经营看板和门店任务协同。"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "生成企业规划报告" }));

    await screen.findByText(demoReport.title);
    fireEvent.change(screen.getByLabelText(/输入追问/), {
      target: { value: "第一份报告如何推进？" }
    });
    fireEvent.click(screen.getByRole("button", { name: "发送追问" }));

    expect(await screen.findByText("第一份报告的追问回答。")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("产品名称"), {
      target: { value: "供应链协同平台" }
    });
    fireEvent.click(screen.getByRole("button", { name: "生成企业规划报告" }));

    expect(await screen.findByText(nextDemoReport.title)).toBeTruthy();
    await waitFor(() =>
      expect(screen.queryByText("第一份报告的追问回答。")).toBeNull()
    );
    expect(screen.getByText(/可以追问/)).toBeTruthy();
  });

  it("ignores a stale in-flight assistant response after a new report becomes active", async () => {
    let resolveChat: (response: {
      ok: boolean;
      json: () => Promise<{ answer: string }>;
    }) => void = () => undefined;
    const pendingChat = new Promise<{
      ok: boolean;
      json: () => Promise<{ answer: string }>;
    }>((resolve) => {
      resolveChat = resolve;
    });
    const fetchMock = workspaceFetchMock({
      "/api/report": [
        jsonResponse({ report: demoReport }),
        jsonResponse({ report: nextDemoReport })
      ],
      "/api/chat": [pendingChat]
    });
    vi.stubGlobal("fetch", fetchMock);
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace user={testUser} />);
    fireEvent.change(screen.getByLabelText("产品名称"), {
      target: { value: "智能门店运营平台" }
    });
    fireEvent.change(screen.getByLabelText("产品简介"), {
      target: {
        value: "为连锁零售团队提供库存预测、经营看板和门店任务协同。"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "生成企业规划报告" }));

    await screen.findByText(demoReport.title);
    fireEvent.change(screen.getByLabelText(/输入追问/), {
      target: { value: "第一份报告还在分析的问题" }
    });
    fireEvent.click(screen.getByRole("button", { name: "发送追问" }));

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => url === "/api/chat")).toBe(
        true
      )
    );
    fireEvent.change(screen.getByLabelText("产品名称"), {
      target: { value: "供应链协同平台" }
    });
    fireEvent.click(screen.getByRole("button", { name: "生成企业规划报告" }));

    expect(await screen.findByText(nextDemoReport.title)).toBeTruthy();
    resolveChat({
      ok: true,
      json: async () => ({ answer: "旧报告延迟返回的回答。" })
    });

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([url]) => url === "/api/report").length
      ).toBe(2)
    );
    expect(screen.queryByText("旧报告延迟返回的回答。")).toBeNull();
    expect(screen.getByText(/可以追问/)).toBeTruthy();
  });
});

describe("planning report rendering", () => {
  it("renders the demo report decision and all structured board tables", async () => {
    const { ReportView } = await import("../../src/components/planning/ReportView");
    const { StructuredBoards } = await import(
      "../../src/components/planning/StructuredBoards"
    );

    render(
      <>
        <ReportView report={demoReport} />
        <StructuredBoards report={demoReport} />
      </>
    );

    expect(screen.getByText(demoReport.executiveDecision.recommendation)).toBeTruthy();
    expect(screen.getAllByText("保守落地型").length).toBeGreaterThan(0);
    expect(screen.getAllByText("增长扩张型").length).toBeGreaterThan(0);
    expect(screen.getAllByText("风险评估型").length).toBeGreaterThan(0);
    expect(screen.getByText("成本表")).toBeTruthy();
    expect(screen.getByText("上线流程表")).toBeTruthy();
    expect(screen.getByText("招聘表")).toBeTruthy();
    expect(screen.getByText("推广表")).toBeTruthy();
    expect(screen.getByText("任务表")).toBeTruthy();
  });
});
