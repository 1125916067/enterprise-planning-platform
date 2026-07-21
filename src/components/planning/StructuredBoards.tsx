import React from "react";

import type {
  CostRow,
  LaunchRow,
  PlanningReport,
  PromotionRow,
  RecruitmentRow,
  TaskRow
} from "@/lib/planning/schema";

export function StructuredBoards({ report }: { report: PlanningReport }) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase text-[#2d7180]">
          Structured Boards
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-normal text-[#172033]">
          结构化执行看板
        </h2>
      </div>

      <DataTable
        columns={[
          { key: "category", label: "类别" },
          { key: "item", label: "项目" },
          { key: "estimate", label: "估算" },
          { key: "timing", label: "时间" },
          { key: "owner", label: "负责人" },
          { key: "rationale", label: "依据" }
        ]}
        rows={report.boards.costs}
        title="成本表"
      />
      <DataTable
        columns={[
          { key: "phase", label: "阶段" },
          { key: "timeframe", label: "周期" },
          { key: "platform", label: "平台" },
          { key: "goal", label: "目标" },
          { key: "successMetric", label: "成功指标" }
        ]}
        rows={report.boards.launches}
        title="上线流程表"
      />
      <DataTable
        columns={[
          { key: "role", label: "岗位" },
          { key: "priority", label: "优先级" },
          { key: "timing", label: "时间" },
          { key: "responsibility", label: "职责" },
          { key: "hiringType", label: "招聘方式" }
        ]}
        rows={report.boards.recruitments}
        title="招聘表"
      />
      <DataTable
        columns={[
          { key: "channel", label: "渠道" },
          { key: "audience", label: "人群" },
          { key: "message", label: "信息" },
          { key: "budget", label: "预算" },
          { key: "metric", label: "指标" }
        ]}
        rows={report.boards.promotions}
        title="推广表"
      />
      <DataTable
        columns={[
          { key: "milestone", label: "里程碑" },
          { key: "task", label: "任务" },
          { key: "owner", label: "负责人" },
          { key: "due", label: "截止" },
          { key: "status", label: "状态" }
        ]}
        rows={report.boards.tasks}
        title="任务表"
      />
    </section>
  );
}

type BoardRow = CostRow | LaunchRow | RecruitmentRow | PromotionRow | TaskRow;

function DataTable<TRow extends BoardRow>({
  columns,
  rows,
  title
}: {
  columns: { key: keyof TRow; label: string }[];
  rows: TRow[];
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#d8dee8] bg-white">
      <div className="border-b border-[#d8dee8] bg-[#f4f7f9] px-4 py-3 text-sm font-semibold text-[#243044]">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[820px] table-fixed border-collapse text-left text-sm">
          <thead className="bg-white text-[#657184]">
            <tr>
              {columns.map((column) => (
                <th
                  className="border-b border-[#e4e9f0] px-3 py-2 font-medium"
                  key={String(column.key)}
                  scope="col"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr className="odd:bg-[#fbfcfd]" key={`${title}-${rowIndex}`}>
                {columns.map((column) => (
                  <td
                    className="border-b border-[#eef2f6] px-3 py-3 align-top leading-6 text-[#354256]"
                    key={String(column.key)}
                  >
                    {String(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
