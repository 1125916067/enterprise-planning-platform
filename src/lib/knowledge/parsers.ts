import mammoth from "mammoth";
import * as XLSX from "xlsx";

export type KnowledgeFile = File;

export function parseTextBuffer(buffer: Buffer) {
  return buffer.toString("utf8");
}

export function parseCsvBuffer(buffer: Buffer) {
  const workbook = XLSX.read(buffer.toString("utf8"), {
    type: "string",
    raw: false
  });

  return stringifyWorkbookRows(workbook);
}

export function parseExcelBuffer(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", raw: false });

  return stringifyWorkbookRows(workbook);
}

export async function parseWordBuffer(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });

  return result.value;
}

export async function parsePdfBuffer(buffer: Buffer) {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);

  return result.text;
}

export async function parseKnowledgeFile(file: KnowledgeFile) {
  const extension = getExtension(file.name);

  switch (extension) {
    case "txt":
    case "md":
      return parseTextBuffer(await readFileBuffer(file));
    case "csv":
      return parseCsvBuffer(await readFileBuffer(file));
    case "xlsx":
    case "xls":
      return parseExcelBuffer(await readFileBuffer(file));
    case "docx":
      return parseWordBuffer(await readFileBuffer(file));
    case "pdf":
      return parsePdfBuffer(await readFileBuffer(file));
    default:
      throw new Error(
        "不支持的知识文件类型。请上传 txt、md、csv、xlsx、xls、docx 或 pdf 文件。"
      );
  }
}

async function readFileBuffer(file: KnowledgeFile) {
  if ("arrayBuffer" in file && typeof file.arrayBuffer === "function") {
    return Buffer.from(await file.arrayBuffer());
  }

  if ("text" in file && typeof file.text === "function") {
    return Buffer.from(await file.text(), "utf8");
  }

  if (typeof FileReader !== "undefined") {
    return new Promise<Buffer>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(Buffer.from(reader.result));
          return;
        }

        reject(new Error("无法读取知识文件内容。"));
      };
      reader.onerror = () => reject(new Error("无法读取知识文件内容。"));
      reader.readAsArrayBuffer(file);
    });
  }

  throw new Error("无法读取知识文件内容。");
}

function getExtension(fileName: string) {
  const lastPart = fileName.split(".").pop();

  return lastPart ? lastPart.toLowerCase() : "";
}

function stringifyWorkbookRows(workbook: XLSX.WorkBook) {
  return workbook.SheetNames.flatMap((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: ""
    });

    return rows.map((row) =>
      Object.entries(row)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(", ")
    );
  }).join("\n");
}
