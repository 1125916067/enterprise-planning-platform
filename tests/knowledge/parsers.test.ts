import { afterEach, describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tmpdir } from "node:os";

import {
  parseCsvBuffer,
  parseKnowledgeFile,
  parseTextBuffer
} from "../../src/lib/knowledge/parsers";

const knowledgeFile = path.join(process.cwd(), ".local-data", "knowledge.json");

describe("knowledge parsers", () => {
  it("parses text buffers as UTF-8", () => {
    const text = parseTextBuffer(Buffer.from("产品背景\n支持知识库。", "utf8"));

    expect(text).toBe("产品背景\n支持知识库。");
  });

  it("parses CSV buffers into row text", () => {
    const csv = Buffer.from("name,value\n目标用户,运营负责人\n预算,50万", "utf8");

    const text = parseCsvBuffer(csv);

    expect(text).toContain("目标用户");
    expect(text).toContain("运营负责人");
    expect(text).toContain("预算");
    expect(text).toContain("50万");
  });

  it("rejects unsupported knowledge files with a clear Chinese message", async () => {
    const file = new File(["irrelevant"], "archive.zip", {
      type: "application/zip"
    });

    await expect(parseKnowledgeFile(file)).rejects.toThrow(
      "不支持的知识文件类型"
    );
  });
});

describe("POST /api/knowledge/upload", () => {
  afterEach(async () => {
    await fs.rm(knowledgeFile, { force: true });
  });

  it("stores an extracted text record for a txt upload", async () => {
    const formData = new FormData();
    formData.set(
      "file",
      new File(["市场调研内容"], "research.txt", { type: "text/plain" })
    );

    const { POST } = await import("../../src/app/api/knowledge/upload/route");
    const response = await POST({
      formData: async () => formData
    } as Request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.record).toMatchObject({
      fileName: "research.txt",
      extractedText: "市场调研内容"
    });
    expect(payload.record.id).toEqual(expect.any(String));
    expect(payload.record.createdAt).toEqual(expect.any(String));

    const saved = JSON.parse(await fs.readFile(knowledgeFile, "utf8"));
    expect(saved).toEqual([payload.record]);
  });

  it("returns 400 for unsupported uploads", async () => {
    const formData = new FormData();
    formData.set(
      "file",
      new File(["bad"], "archive.zip", { type: "application/zip" })
    );

    const { POST } = await import("../../src/app/api/knowledge/upload/route");
    const response = await POST({
      formData: async () => formData
    } as Request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("不支持的知识文件类型");
  });
});

describe("local JSON storage", () => {
  const originalCwd = process.cwd();
  let tempDir = "";

  afterEach(async () => {
    process.chdir(originalCwd);

    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("returns fallback when JSON is missing or invalid", async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), "knowledge-store-"));
    process.chdir(tempDir);

    const { readJsonFile, writeJsonFile } = await import(
      "../../src/lib/storage/local-store"
    );
    const fallback = [{ id: "fallback" }];

    await expect(readJsonFile("missing.json", fallback)).resolves.toBe(fallback);

    await writeJsonFile("valid.json", { ok: true });
    await expect(readJsonFile("valid.json", fallback)).resolves.toEqual({
      ok: true
    });

    await fs.writeFile(
      path.join(tempDir, ".local-data", "broken.json"),
      "{not json",
      "utf8"
    );
    await expect(readJsonFile("broken.json", fallback)).resolves.toBe(fallback);
  });
});
