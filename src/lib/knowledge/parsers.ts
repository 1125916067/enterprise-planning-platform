import JSZip from "jszip";
import mammoth from "mammoth";

export type KnowledgeFile = File;

export function parseTextBuffer(buffer: Buffer) {
  return buffer.toString("utf8");
}

export function parseCsvBuffer(buffer: Buffer) {
  const rows = parseCsvRows(buffer.toString("utf8"));
  return stringifyRows(rows);
}

export async function parseExcelBuffer(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const sharedStrings = await readSharedStrings(zip);
  const worksheets = await readWorksheetRefs(zip);

  const sheets = await Promise.all(
    worksheets.map(async (worksheet, index) => {
      const sheetXml = await zip.file(worksheet.path)?.async("string");
      const rows = sheetXml ? parseWorksheetRows(sheetXml, sharedStrings) : [];
      return stringifyRows(rows, worksheet.name || `Sheet${index + 1}`);
    })
  );

  return sheets.filter(Boolean).join("\n");
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
      return parseExcelBuffer(await readFileBuffer(file));
    case "xls":
      throw new Error("暂不支持旧版 xls 文件。请将表格另存为 xlsx 后上传。");
    case "docx":
      return parseWordBuffer(await readFileBuffer(file));
    case "pdf":
      return parsePdfBuffer(await readFileBuffer(file));
    default:
      throw new Error(
        "不支持的知识文件类型。请上传 txt、md、csv、xlsx、docx 或 pdf 文件。"
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

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      cell += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);

  return rows.filter((items) => items.some((item) => item.trim().length > 0));
}

function stringifyRows(rows: string[][], sheetName?: string) {
  if (rows.length === 0) {
    return sheetName ? `${sheetName}\n` : "";
  }

  const [headers, ...bodyRows] = rows;
  const contentRows = bodyRows.length > 0 ? bodyRows : [headers];
  const effectiveHeaders = bodyRows.length > 0 ? headers : headers.map((_, index) => `列${index + 1}`);
  const lines = contentRows.map((row) =>
    effectiveHeaders
      .map((header, index) => `${header || `列${index + 1}`}: ${row[index] || ""}`)
      .join(", ")
  );

  return [sheetName, ...lines].filter(Boolean).join("\n");
}

async function readSharedStrings(zip: JSZip) {
  const sharedStringsXml = await zip.file("xl/sharedStrings.xml")?.async("string");
  if (!sharedStringsXml) {
    return [];
  }

  return [...sharedStringsXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
    [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
      .map((textMatch) => decodeXmlText(textMatch[1]))
      .join("")
  );
}

async function readWorksheetRefs(zip: JSZip) {
  const workbookXml = await zip.file("xl/workbook.xml")?.async("string");
  if (!workbookXml) {
    return readFallbackWorksheetRefs(zip);
  }

  const relationships = await readWorkbookRelationships(zip);
  const worksheets = [...workbookXml.matchAll(/<sheet\b([^>]*)\/?>/g)]
    .map((match, index) => {
      const attributes = parseXmlAttributes(match[1]);
      const relationshipId = attributes["r:id"];
      const targetPath = relationshipId ? relationships.get(relationshipId) : undefined;

      return {
        name: attributes.name ? decodeXmlText(attributes.name) : `Sheet${index + 1}`,
        path: targetPath || `xl/worksheets/sheet${index + 1}.xml`
      };
    })
    .filter((worksheet) => Boolean(zip.file(worksheet.path)));

  return worksheets.length > 0 ? worksheets : readFallbackWorksheetRefs(zip);
}

async function readWorkbookRelationships(zip: JSZip) {
  const relationshipsXml = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
  const relationships = new Map<string, string>();

  if (!relationshipsXml) {
    return relationships;
  }

  for (const match of relationshipsXml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const attributes = parseXmlAttributes(match[1]);

    if (attributes.Id && attributes.Target) {
      relationships.set(attributes.Id, normalizeWorkbookTarget(attributes.Target));
    }
  }

  return relationships;
}

function readFallbackWorksheetRefs(zip: JSZip) {
  return Object.keys(zip.files)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((path, index) => ({ name: `Sheet${index + 1}`, path }));
}

function normalizeWorkbookTarget(target: string) {
  const decodedTarget = decodeXmlText(target);
  const withoutLeadingSlash = decodedTarget.startsWith("/")
    ? decodedTarget.slice(1)
    : decodedTarget;

  if (withoutLeadingSlash.startsWith("xl/")) {
    return withoutLeadingSlash;
  }

  return `xl/${withoutLeadingSlash}`;
}

function parseXmlAttributes(value: string) {
  return Object.fromEntries(
    [...value.matchAll(/\s([:\w-]+)="([^"]*)"/g)].map((match) => [
      match[1],
      match[2]
    ])
  );
}

function parseWorksheetRows(sheetXml: string, sharedStrings: string[]) {
  return [...sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const cells = [...rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)];
    const values: string[] = [];

    for (const cell of cells) {
      const attributes = cell[1];
      const body = cell[2];
      const column = cellColumnIndex(attributes);
      values[column] = readCellValue(attributes, body, sharedStrings);
    }

    return values.map((value) => value || "");
  });
}

function cellColumnIndex(attributes: string) {
  const ref = attributes.match(/\br="([A-Z]+)\d+"/)?.[1] || "A";
  return [...ref].reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function readCellValue(attributes: string, body: string, sharedStrings: string[]) {
  const inlineText = body.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1];
  if (inlineText !== undefined) {
    return decodeXmlText(inlineText);
  }

  const rawValue = body.match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1] || "";
  if (/\bt="s"/.test(attributes)) {
    return sharedStrings[Number(rawValue)] || "";
  }

  return decodeXmlText(rawValue);
}

function decodeXmlText(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}
