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
const invalidJsonMessage = "请求 JSON 格式无效，请检查后重试。";
const invalidInputMessage = "请求参数无效，请检查规划输入后重试。";
const invalidAiReportMessage = "AI 返回内容格式不符合要求，请重试。";
const genericFailureMessage = "生成规划报告失败，请稍后重试。";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: invalidJsonMessage }, { status: 400 });
  }

  try {
    const bodyRecord = toRecord(body);
    const inputResult = planningInputSchema.safeParse(bodyRecord.input);

    if (!inputResult.success) {
      return NextResponse.json({ error: invalidInputMessage }, { status: 400 });
    }

    const prompt = buildPlanningPrompt({
      input: inputResult.data,
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
    const repairedReport = planningReportSchema.safeParse(repaired);

    if (!repairedReport.success) {
      console.error("AI report repair returned invalid content.", repairedReport.error);

      return NextResponse.json(
        { error: invalidAiReportMessage },
        { status: 502 }
      );
    }

    return NextResponse.json({ report: repairedReport.data });
  } catch (error) {
    if (error instanceof MissingDeepSeekKeyError) {
      return NextResponse.json({ error: missingKeyMessage }, { status: 400 });
    }

    console.error("Failed to generate planning report.", error);

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
