import { NextResponse } from "next/server";

import {
  callDeepSeekText,
  MissingDeepSeekKeyError
} from "../../../lib/ai/deepseek";
import { buildFollowUpPrompt } from "../../../lib/ai/prompts";
import { planningReportSchema } from "../../../lib/planning/schema";

const missingKeyMessage =
  "缺少 DeepSeek API Key。请在项目根目录创建或更新 .env.local，添加 DEEPSEEK_API_KEY=你的DeepSeek密钥，然后重启开发服务器。";
const invalidJsonMessage = "请求 JSON 格式无效，请检查后重试。";
const invalidReportMessage = "report 无效，请检查报告内容后重试。";
const genericFailureMessage = "生成追问回答失败，请稍后重试。";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: invalidJsonMessage }, { status: 400 });
  }

  const bodyRecord = toRecord(body);
  const question =
    typeof bodyRecord.question === "string" ? bodyRecord.question.trim() : "";

  if (!question) {
    return NextResponse.json(
      { error: "question 不能为空。" },
      { status: 400 }
    );
  }

  const reportResult = planningReportSchema.safeParse(bodyRecord.report);

  if (!reportResult.success) {
    return NextResponse.json({ error: invalidReportMessage }, { status: 400 });
  }

  try {
    const report = reportResult.data;
    const prompt = buildFollowUpPrompt({
      question,
      reportTitle: report.title,
      reportJson: report
    });
    const answer = await callDeepSeekText(prompt);

    return NextResponse.json({ answer });
  } catch (error) {
    if (error instanceof MissingDeepSeekKeyError) {
      return NextResponse.json({ error: missingKeyMessage }, { status: 400 });
    }

    console.error("Failed to answer planning report follow-up.", error);

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
