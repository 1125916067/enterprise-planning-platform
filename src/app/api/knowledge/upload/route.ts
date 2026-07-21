import { NextResponse } from "next/server";

import { parseKnowledgeFile } from "../../../../lib/knowledge/parsers";
import {
  readJsonFile,
  writeJsonFile
} from "../../../../lib/storage/local-store";

export const runtime = "nodejs";

const maxUploadBytes = 8 * 1024 * 1024;
const knowledgeFileName = "knowledge.json";
const missingFileMessage = "请上传知识文件。";
const invalidFileMessage = "上传内容无效，请选择一个文件。";
const tooLargeMessage = "知识文件不能超过 8MB。";
const genericFailureMessage = "知识文件上传失败，请稍后重试。";

export type KnowledgeRecord = {
  id: string;
  fileName: string;
  extractedText: string;
  createdAt: string;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!fileValue) {
      return NextResponse.json({ error: missingFileMessage }, { status: 400 });
    }

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: invalidFileMessage }, { status: 400 });
    }

    if (fileValue.size > maxUploadBytes) {
      return NextResponse.json({ error: tooLargeMessage }, { status: 400 });
    }

    const extractedText = await parseKnowledgeFile(fileValue);
    const existingRecords = await readJsonFile<KnowledgeRecord[]>(
      knowledgeFileName,
      []
    );
    const record: KnowledgeRecord = {
      id: crypto.randomUUID(),
      fileName: fileValue.name,
      extractedText,
      createdAt: new Date().toISOString()
    };

    await writeJsonFile(knowledgeFileName, [...existingRecords, record]);

    return NextResponse.json({ record });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("不支持的知识文件类型")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to upload knowledge file.", error);

    return NextResponse.json(
      { error: genericFailureMessage },
      { status: 500 }
    );
  }
}
