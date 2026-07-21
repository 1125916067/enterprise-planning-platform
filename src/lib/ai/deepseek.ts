import "server-only";

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export class MissingDeepSeekKeyError extends Error {
  constructor() {
    super("Missing DEEPSEEK_API_KEY environment variable.");
    this.name = "MissingDeepSeekKeyError";
  }
}

export class DeepSeekApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DeepSeekApiError";
    this.status = status;
  }
}

export function parseDeepSeekJsonResponse<T = unknown>(content: string): T {
  const jsonText = extractJsonText(content);

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    throw new DeepSeekApiError("DeepSeek response was not valid JSON", 200);
  }
}

export async function callDeepSeekJson<T = unknown>(prompt: string): Promise<T> {
  const content = await callDeepSeekText(prompt);

  return parseDeepSeekJsonResponse<T>(content);
}

export async function callDeepSeekText(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    throw new MissingDeepSeekKeyError();
  }

  const baseUrl =
    process.env.DEEPSEEK_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_DEEPSEEK_BASE_URL;
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL,
      messages: buildMessages(prompt),
      temperature: 0.2
    })
  });

  const payload = await readDeepSeekPayload(response);

  if (!response.ok) {
    throw new DeepSeekApiError(
      `DeepSeek request failed with status ${response.status}.`,
      response.status
    );
  }

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new DeepSeekApiError("DeepSeek response did not include message content.", response.status);
  }

  return content;
}

async function readDeepSeekPayload(response: Response): Promise<DeepSeekChatResponse> {
  try {
    return (await response.json()) as DeepSeekChatResponse;
  } catch {
    throw new DeepSeekApiError("DeepSeek response was not valid JSON", response.status);
  }
}

function buildMessages(prompt: string): DeepSeekMessage[] {
  return [
    {
      role: "system",
      content:
        "You are a precise enterprise planning assistant. Follow the user's output format exactly."
    },
    {
      role: "user",
      content: prompt
    }
  ];
}

function extractJsonText(content: string): string {
  const trimmed = content.trim();
  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fencedJson?.[1]) {
    return fencedJson[1].trim();
  }

  return trimmed;
}
