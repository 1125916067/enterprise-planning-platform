import { NextResponse } from "next/server";

import {
  callDeepSeekText,
  MissingDeepSeekKeyError
} from "../../../lib/ai/deepseek";
import { buildFollowUpPrompt } from "../../../lib/ai/prompts";
import { planningReportSchema } from "../../../lib/planning/schema";

const missingKeyMessage =
  "缺少 DeepSeek API Key。请在项目根目录创建或更新 .env.local，添加 DEEPSEEK_API_KEY=你的DeepSeek密钥，然后重启开发服务器。";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const bodyRecord = toRecord(body);
    const question =
      typeof bodyRecord.question === "string" ? bodyRecord.question.trim() : "";

    if (!question) {
      return NextResponse.json(
        { error: "question 不能为空。" },
        { status: 400 }
      );
    }

    const report = planningReportSchema.parse(bodyRecord.report);
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

    if (isValidationError(error)) {
      return NextResponse.json(
        { error: `report 无效：${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `生成追问回答失败：${getErrorMessage(error)}` },
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

function isValidationError(error: unknown): error is Error {
  return error instanceof Error && error.name === "ZodError";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "请稍后重试。";
}
