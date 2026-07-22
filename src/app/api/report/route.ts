import { NextResponse } from "next/server";

import {
  callDeepSeekJson,
  MissingDeepSeekKeyError
} from "../../../lib/ai/deepseek";
import { buildPlanningPrompt } from "../../../lib/ai/prompts";
import { repairJsonResponse } from "../../../lib/ai/repair";
import { requireSessionUser } from "../../../lib/auth/http";
import {
  getBillingUserIdForRequest,
  setBillingCookie
} from "../../../lib/billing/http";
import {
  chargeTokens,
  ensureSufficientTokens,
  getBillingStatus,
  InsufficientTokensError
} from "../../../lib/billing/store";
import { estimateJsonTokens, estimateTokens } from "../../../lib/billing/tokens";
import {
  planningInputSchema,
  planningReportSchema
} from "../../../lib/planning/schema";
import { readJsonFile } from "../../../lib/storage/local-store";
import type { KnowledgeRecord } from "../knowledge/upload/route";

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
    await requireSessionUser(request);
    const bodyRecord = toRecord(body);
    const inputResult = planningInputSchema.safeParse(bodyRecord.input);

    if (!inputResult.success) {
      return NextResponse.json({ error: invalidInputMessage }, { status: 400 });
    }

    if (!process.env.DEEPSEEK_API_KEY?.trim()) {
      return NextResponse.json({ error: missingKeyMessage }, { status: 400 });
    }

    const storedKnowledgeContext = await buildStoredKnowledgeContext();
    const knowledgeContext = [
      typeof bodyRecord.knowledgeContext === "string"
        ? bodyRecord.knowledgeContext
        : "",
      storedKnowledgeContext
    ]
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n\n");

    const prompt = buildPlanningPrompt({
      input: inputResult.data,
      knowledgeContext
    });
    const billingStatus = await getBillingStatus(
      await getBillingUserIdForRequest(request)
    );
    const promptTokens = estimateTokens(prompt);

    await ensureSufficientTokens(billingStatus.account.userId, promptTokens);

    const raw = await callDeepSeekJson<unknown>(prompt);
    const parsedReport = planningReportSchema.safeParse(raw);

    if (parsedReport.success) {
      await chargeTokens(
        billingStatus.account.userId,
        promptTokens + estimateJsonTokens(parsedReport.data),
        "report"
      );

      const response = NextResponse.json({ report: parsedReport.data });

      return setBillingCookie(response, billingStatus.account.userId);
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

    await chargeTokens(
      billingStatus.account.userId,
      promptTokens + estimateJsonTokens(repairedReport.data),
      "report"
    );

    const response = NextResponse.json({ report: repairedReport.data });

    return setBillingCookie(response, billingStatus.account.userId);
  } catch (error) {
    if (error instanceof MissingDeepSeekKeyError) {
      return NextResponse.json({ error: missingKeyMessage }, { status: 400 });
    }

    if (error instanceof InsufficientTokensError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }

    if (error instanceof Error && error.message.includes("请先登录")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
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

async function buildStoredKnowledgeContext() {
  const records = await readJsonFile<KnowledgeRecord[]>("knowledge.json", []);

  return records
    .filter(isKnowledgeRecord)
    .sort(
      (first, second) =>
        knowledgeTimestamp(second.createdAt) - knowledgeTimestamp(first.createdAt)
    )
    .slice(0, 5)
    .map(
      ({ fileName, extractedText }) =>
        `文件：${fileName}\n${extractedText.slice(0, 4000)}`
    )
    .join("\n\n");
}

function isKnowledgeRecord(value: unknown): value is KnowledgeRecord {
  const record = toRecord(value);

  return (
    typeof record.fileName === "string" &&
    typeof record.extractedText === "string" &&
    typeof record.createdAt === "string"
  );
}

function knowledgeTimestamp(createdAt: string) {
  const timestamp = Date.parse(createdAt);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}
