import { afterEach, describe, expect, it, vi } from "vitest";

import {
  callDeepSeekJson,
  MissingDeepSeekKeyError
} from "../../src/lib/ai/deepseek";

describe("callDeepSeekJson", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("throws MissingDeepSeekKeyError when DEEPSEEK_API_KEY is missing", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");

    await expect(callDeepSeekJson("生成规划报告")).rejects.toBeInstanceOf(
      MissingDeepSeekKeyError
    );
  });

  it("calls DeepSeek chat completions with bearer auth and parses message JSON", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_BASE_URL", "https://deepseek.example/v1");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '```json\n{"title":"规划报告","boards":{"costs":[]}}\n```'
            }
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(callDeepSeekJson("生成规划报告")).resolves.toEqual({
      title: "规划报告",
      boards: { costs: [] }
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://deepseek.example/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json"
        })
      })
    );
  });
});
