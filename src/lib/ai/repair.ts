import {
  callDeepSeekJson,
  parseDeepSeekJsonResponse
} from "./deepseek";

type RepairJsonResponseParams = {
  invalidJson: string;
  validationMessage: string;
};

export async function repairJsonResponse<T = unknown>({
  invalidJson,
  validationMessage
}: RepairJsonResponseParams): Promise<T> {
  const repairPrompt = [
    "请修复下面的 JSON 响应，使其成为严格合法 JSON，并满足校验错误要求。",
    "只返回修复后的 JSON，不要输出 Markdown、解释或额外文字。",
    `校验错误：${validationMessage}`,
    `原始响应：${invalidJson}`
  ].join("\n\n");

  const repaired = await callDeepSeekJson<string | T>(repairPrompt);

  if (typeof repaired === "string") {
    return parseDeepSeekJsonResponse<T>(repaired);
  }

  return repaired as T;
}
