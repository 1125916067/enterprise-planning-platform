import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { demoReport } from "../../src/lib/planning/demo-data";

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
