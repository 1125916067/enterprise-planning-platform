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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PlanningWorkspace", () => {
  it("renders the initial planning workspace", async () => {
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace />);

    expect(screen.getByText("产品专业输入")).toBeTruthy();
    expect(screen.getByText("企业规划报告")).toBeTruthy();
    expect(screen.getByText("右侧 AI 追问")).toBeTruthy();
    expect(screen.getByText(/请先在左侧填写产品信息/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /导出 PDF/ })).toBeNull();
    expect(screen.getByRole("button", { name: "发送追问" })).toHaveProperty(
      "disabled",
      true
    );
  });

  it("submits the form to the report API with a valid PlanningInput shape", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ report: demoReport })
    });
    vi.stubGlobal("fetch", fetchMock);
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace />);
    fireEvent.change(screen.getByLabelText("产品名称"), {
      target: { value: "智能门店运营平台" }
    });
    fireEvent.change(screen.getByLabelText("产品简介"), {
      target: {
        value: "为连锁零售团队提供库存预测、经营看板和门店任务协同。"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "生成企业规划报告" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.any(String)
    });
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);

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

  it("clears the previous report and export controls when a second generation fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ report: demoReport })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "生成规划报告失败，请稍后重试。" })
      });
    vi.stubGlobal("fetch", fetchMock);
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace />);
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
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ report: demoReport })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ answer: "建议先确认三家试点门店的数据质量。" })
      });
    vi.stubGlobal("fetch", fetchMock);
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace />);
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

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "先做哪些试点准备？", report: demoReport })
    });
    expect(await screen.findByText("建议先确认三家试点门店的数据质量。")).toBeTruthy();
  });

  it("resets assistant messages when a new report becomes active", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ report: demoReport })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ answer: "第一份报告的追问回答。" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ report: nextDemoReport })
      });
    vi.stubGlobal("fetch", fetchMock);
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace />);
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
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ report: demoReport })
      })
      .mockReturnValueOnce(pendingChat)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ report: nextDemoReport })
      });
    vi.stubGlobal("fetch", fetchMock);
    const { PlanningWorkspace } = await import(
      "../../src/components/planning/PlanningWorkspace"
    );

    render(<PlanningWorkspace />);
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

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    fireEvent.change(screen.getByLabelText("产品名称"), {
      target: { value: "供应链协同平台" }
    });
    fireEvent.click(screen.getByRole("button", { name: "生成企业规划报告" }));

    expect(await screen.findByText(nextDemoReport.title)).toBeTruthy();
    resolveChat({
      ok: true,
      json: async () => ({ answer: "旧报告延迟返回的回答。" })
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
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
