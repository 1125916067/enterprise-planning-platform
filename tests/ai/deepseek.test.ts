import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  DeepSeekApiError,
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

  it("does not leak upstream error bodies in thrown messages", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-secret-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          message: "Invalid token test-secret-key"
        }
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    let error: unknown;
    try {
      await callDeepSeekJson("生成规划报告");
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      name: "DeepSeekApiError",
      status: 401,
      message: "DeepSeek request failed with status 401."
    });
    expect((error as Error).message).not.toContain("test-secret-key");
  });

  it("wraps malformed JSON content in DeepSeekApiError without leaking raw content", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: "not-json-with-sensitive-details"
              }
            }
          ]
        })
      })
    );

    let error: unknown;
    try {
      await callDeepSeekJson("生成规划报告");
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(DeepSeekApiError);
    expect(error).toMatchObject({
      message: "DeepSeek response was not valid JSON",
      status: 200
    });
    expect((error as Error).message).not.toContain(
      "not-json-with-sensitive-details"
    );
  });

  it("parses fenced JSON content", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: '```json\n{"title":"围栏 JSON","sourceNotes":[]}\n```'
              }
            }
          ]
        })
      })
    );

    await expect(callDeepSeekJson("生成规划报告")).resolves.toEqual({
      title: "围栏 JSON",
      sourceNotes: []
    });
  });
});
