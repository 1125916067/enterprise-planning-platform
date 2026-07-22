import { afterEach, describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tmpdir } from "node:os";
import JSZip from "jszip";

import {
  parseCsvBuffer,
  parseExcelBuffer,
  parseKnowledgeFile,
  parseTextBuffer
} from "../../src/lib/knowledge/parsers";
import { buildXlsxWorkbook } from "../../src/lib/export/xlsx";
import { demoReport } from "../../src/lib/planning/demo-data";

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

  it("parses XLSX buffers into row text", async () => {
    const buffer = await buildXlsxWorkbook(demoReport);

    const text = await parseExcelBuffer(buffer);

    expect(text).toContain("成本表");
    expect(text).toContain(`项目: ${demoReport.boards.costs[0].item}`);
    expect(text).toContain(`负责人: ${demoReport.boards.costs[0].owner}`);
  });

  it("parses XLSX worksheets through workbook relationships", async () => {
    const buffer = await buildRelationshipMappedWorkbook();

    const text = await parseExcelBuffer(buffer);

    expect(text).toContain("自定义调研");
    expect(text).toContain("指标: 目标客群");
    expect(text).toContain("内容: 连锁零售运营负责人");
  });

  it("rejects legacy xls files with a safe migration message", async () => {
    const file = new File(["legacy"], "legacy.xls", {
      type: "application/vnd.ms-excel"
    });

    await expect(parseKnowledgeFile(file)).rejects.toThrow(
      "请将表格另存为 xlsx"
    );
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
  const originalCwd = process.cwd();
  let tempDir = "";

  afterEach(async () => {
    process.chdir(originalCwd);

    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  async function useTempCwd() {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), "knowledge-upload-"));
    process.chdir(tempDir);

    return path.join(tempDir, ".local-data", "knowledge.json");
  }

  it("stores an extracted text record for a txt upload", async () => {
    const knowledgeFile = await useTempCwd();
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
    await useTempCwd();
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

  it("returns 400 for legacy xls uploads with migration guidance", async () => {
    await useTempCwd();
    const formData = new FormData();
    formData.set(
      "file",
      new File(["legacy"], "legacy.xls", {
        type: "application/vnd.ms-excel"
      })
    );

    const { POST } = await import("../../src/app/api/knowledge/upload/route");
    const response = await POST({
      formData: async () => formData
    } as Request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("请将表格另存为 xlsx");
  });

  it("returns 413 for oversized uploads", async () => {
    await useTempCwd();
    const formData = new FormData();
    formData.set(
      "file",
      new File(["x".repeat(8 * 1024 * 1024 + 1)], "large.txt", {
        type: "text/plain"
      })
    );

    const { POST } = await import("../../src/app/api/knowledge/upload/route");
    const response = await POST({
      formData: async () => formData
    } as Request);
    const payload = await response.json();

    expect(response.status).toBe(413);
    expect(payload.error).toContain("8MB");
  });
});

async function buildRelationshipMappedWorkbook() {
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/custom-data.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`
  );
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="自定义调研" sheetId="1" r:id="rId9"/>
  </sheets>
</workbook>`
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/custom-data.xml"/>
</Relationships>`
  );
  zip.file(
    "xl/sharedStrings.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="4" uniqueCount="4">
  <si><t>指标</t></si>
  <si><t>内容</t></si>
  <si><t>目标客群</t></si>
  <si><t>连锁零售运营负责人</t></si>
</sst>`
  );
  zip.file(
    "xl/worksheets/custom-data.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
    <row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2" t="s"><v>3</v></c></row>
  </sheetData>
</worksheet>`
  );

  return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
}

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

  it("rejects unsafe JSON file names", async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), "knowledge-store-"));
    process.chdir(tempDir);

    const { readJsonFile, writeJsonFile } = await import(
      "../../src/lib/storage/local-store"
    );
    const fallback = [{ id: "fallback" }];
    const unsafeNames = [
      "../knowledge.json",
      "nested/knowledge.json",
      "nested\\knowledge.json",
      path.resolve(tempDir, "knowledge.json"),
      "knowledge.txt",
      "know..ledge.json"
    ];

    for (const name of unsafeNames) {
      await expect(readJsonFile(name, fallback)).rejects.toThrow(
        "本地 JSON 文件名无效"
      );
      await expect(writeJsonFile(name, [])).rejects.toThrow(
        "本地 JSON 文件名无效"
      );
    }
  });
});
