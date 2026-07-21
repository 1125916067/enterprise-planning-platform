import { NextResponse } from "next/server";

import {
  callDeepSeekJson,
  MissingDeepSeekKeyError
} from "../../../lib/ai/deepseek";
import { buildPlanningPrompt } from "../../../lib/ai/prompts";
import { repairJsonResponse } from "../../../lib/ai/repair";
import {
  planningInputSchema,
  planningReportSchema
} from "../../../lib/planning/schema";

const missingKeyMessage =
  "缺少 DeepSeek API Key。请在项目根目录创建或更新 .env.local，添加 DEEPSEEK_API_KEY=你的DeepSeek密钥，然后重启开发服务器。";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const bodyRecord = toRecord(body);
    const input = planningInputSchema.parse(bodyRecord.input);
    const prompt = buildPlanningPrompt({
      input,
      knowledgeContext:
        typeof bodyRecord.knowledgeContext === "string"
          ? bodyRecord.knowledgeContext
          : ""
    });
    const raw = await callDeepSeekJson<unknown>(prompt);
    const parsedReport = planningReportSchema.safeParse(raw);

    if (parsedReport.success) {
      return NextResponse.json({ report: parsedReport.data });
    }

    const repaired = await repairJsonResponse({
      invalidJson: stringifyInvalidJson(raw),
      validationMessage: parsedReport.error.message
    });
    const report = planningReportSchema.parse(repaired);

    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof MissingDeepSeekKeyError) {
      return NextResponse.json({ error: missingKeyMessage }, { status: 400 });
    }

    if (isValidationError(error)) {
      return NextResponse.json(
        { error: `请求参数无效：${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `生成规划报告失败：${getErrorMessage(error)}` },
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

function stringifyInvalidJson(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
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
