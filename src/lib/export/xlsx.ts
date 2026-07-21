import * as XLSX from "xlsx";

import type { PlanningReport } from "@/lib/planning/schema";

export async function buildXlsxWorkbook(report: PlanningReport): Promise<Buffer> {
  const workbook = XLSX.utils.book_new();

  appendSheet(workbook, "成本表", report.boards.costs, {
    category: "类别",
    item: "项目",
    estimate: "预算估算",
    timing: "时间",
    owner: "负责人",
    rationale: "依据"
  });
  appendSheet(workbook, "上线流程", report.boards.launches, {
    phase: "阶段",
    timeframe: "时间范围",
    platform: "平台",
    goal: "目标",
    successMetric: "成功指标"
  });
  appendSheet(workbook, "招聘表", report.boards.recruitments, {
    role: "岗位",
    priority: "优先级",
    timing: "招聘时间",
    responsibility: "职责",
    hiringType: "招聘方式"
  });
  appendSheet(workbook, "推广表", report.boards.promotions, {
    channel: "渠道",
    audience: "受众",
    message: "信息",
    budget: "预算",
    metric: "指标"
  });
  appendSheet(workbook, "任务表", report.boards.tasks, {
    milestone: "里程碑",
    task: "任务",
    owner: "负责人",
    due: "截止时间",
    status: "状态"
  });

  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}

function appendSheet<TRow extends Record<string, string>>(
  workbook: XLSX.WorkBook,
  sheetName: string,
  rows: TRow[],
  headers: Record<keyof TRow, string>
) {
  const keys = Object.keys(headers) as Array<keyof TRow>;
  const localizedRows = rows.map((row) =>
    keys.reduce<Record<string, string>>((result, key) => {
      result[headers[key]] = row[key];
      return result;
    }, {})
  );
  const worksheet = XLSX.utils.json_to_sheet(localizedRows, {
    header: keys.map((key) => headers[key])
  });

  worksheet["!cols"] = keys.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
}
