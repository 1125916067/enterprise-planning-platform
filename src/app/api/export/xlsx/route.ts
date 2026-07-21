import { NextResponse } from "next/server";

import { buildXlsxWorkbook } from "@/lib/export/xlsx";
import { planningReportSchema } from "@/lib/planning/schema";

export const runtime = "nodejs";

const invalidJsonMessage = "请求 JSON 格式无效，请检查后重试。";
const invalidReportMessage = "报告数据无效，请检查后重试。";
const genericFailureMessage = "导出报告失败，请稍后重试。";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: invalidJsonMessage }, { status: 400 });
  }

  const reportResult = planningReportSchema.safeParse(toRecord(body).report);

  if (!reportResult.success) {
    return NextResponse.json({ error: invalidReportMessage }, { status: 400 });
  }

  try {
    const buffer = await buildXlsxWorkbook(reportResult.data);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="enterprise-planning-boards.xlsx"'
      }
    });
  } catch (error) {
    console.error("Failed to export Excel planning report.", error);

    return NextResponse.json(
      { error: genericFailureMessage },
      { status: 500 }
    );
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
