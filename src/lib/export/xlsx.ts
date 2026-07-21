import JSZip from "jszip";

import type { PlanningReport } from "@/lib/planning/schema";

type SheetDefinition = {
  name: string;
  rows: Record<string, string>[];
  headers: Record<string, string>;
};

export async function buildXlsxWorkbook(report: PlanningReport): Promise<Buffer> {
  const sheets = [
    sheet("成本表", report.boards.costs, {
      category: "类别",
      item: "项目",
      estimate: "预算估算",
      timing: "时间",
      owner: "负责人",
      rationale: "依据"
    }),
    sheet("上线流程", report.boards.launches, {
      phase: "阶段",
      timeframe: "时间范围",
      platform: "平台",
      goal: "目标",
      successMetric: "成功指标"
    }),
    sheet("招聘表", report.boards.recruitments, {
      role: "岗位",
      priority: "优先级",
      timing: "招聘时间",
      responsibility: "职责",
      hiringType: "招聘方式"
    }),
    sheet("推广表", report.boards.promotions, {
      channel: "渠道",
      audience: "受众",
      message: "信息",
      budget: "预算",
      metric: "指标"
    }),
    sheet("任务表", report.boards.tasks, {
      milestone: "里程碑",
      task: "任务",
      owner: "负责人",
      due: "截止时间",
      status: "状态"
    })
  ];

  const zip = new JSZip();
  zip.file("[Content_Types].xml", buildContentTypesXml(sheets.length));
  zip.folder("_rels")?.file(".rels", buildRootRelsXml());
  const xl = zip.folder("xl");
  xl?.file("workbook.xml", buildWorkbookXml(sheets));
  xl?.file("styles.xml", buildStylesXml());
  xl?.folder("_rels")?.file("workbook.xml.rels", buildWorkbookRelsXml(sheets.length));
  const worksheets = xl?.folder("worksheets");

  sheets.forEach((definition, index) => {
    worksheets?.file(`sheet${index + 1}.xml`, buildWorksheetXml(definition));
  });

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });

  return Buffer.from(buffer);
}

function sheet(
  name: string,
  rows: Record<string, string>[],
  headers: Record<string, string>
): SheetDefinition {
  return { name, rows, headers };
}

function buildContentTypesXml(sheetCount: number) {
  const sheetOverrides = Array.from({ length: sheetCount }, (_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("");

  return xml([
    "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">",
    "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>",
    "<Default Extension=\"xml\" ContentType=\"application/xml\"/>",
    "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>",
    "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>",
    sheetOverrides,
    "</Types>"
  ]);
}

function buildRootRelsXml() {
  return xml([
    "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">",
    "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>",
    "</Relationships>"
  ]);
}

function buildWorkbookXml(sheets: SheetDefinition[]) {
  const sheetXml = sheets
    .map(
      (definition, index) =>
        `<sheet name="${escapeXmlAttribute(definition.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
    )
    .join("");

  return xml([
    "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">",
    `<sheets>${sheetXml}</sheets>`,
    "</workbook>"
  ]);
}

function buildWorkbookRelsXml(sheetCount: number) {
  const worksheetRels = Array.from({ length: sheetCount }, (_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  ).join("");

  return xml([
    "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">",
    worksheetRels,
    "<Relationship Id=\"rIdStyles\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>",
    "</Relationships>"
  ]);
}

function buildStylesXml() {
  return xml([
    "<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">",
    "<fonts count=\"2\"><font><sz val=\"11\"/><name val=\"Arial\"/></font><font><b/><sz val=\"11\"/><name val=\"Arial\"/></font></fonts>",
    "<fills count=\"1\"><fill><patternFill patternType=\"none\"/></fill></fills>",
    "<borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders>",
    "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>",
    "<cellXfs count=\"2\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/><xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\"/></cellXfs>",
    "</styleSheet>"
  ]);
}

function buildWorksheetXml(definition: SheetDefinition) {
  const keys = Object.keys(definition.headers);
  const headerValues = keys.map((key) => definition.headers[key]);
  const rows = [
    buildRowXml(1, headerValues, true),
    ...definition.rows.map((row, index) =>
      buildRowXml(
        index + 2,
        keys.map((key) => row[key]),
        false
      )
    )
  ].join("");
  const columnXml = keys.map((_, index) => `<col min="${index + 1}" max="${index + 1}" width="22" customWidth="1"/>`).join("");

  return xml([
    "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">",
    `<cols>${columnXml}</cols>`,
    `<sheetData>${rows}</sheetData>`,
    "</worksheet>"
  ]);
}

function buildRowXml(rowNumber: number, values: string[], bold: boolean) {
  const cells = values
    .map((value, index) => {
      const ref = `${columnName(index + 1)}${rowNumber}`;
      const style = bold ? " s=\"1\"" : "";
      return `<c r="${ref}" t="inlineStr"${style}><is><t>${escapeXmlText(value)}</t></is></c>`;
    })
    .join("");

  return `<row r="${rowNumber}">${cells}</row>`;
}

function columnName(index: number) {
  let name = "";
  let current = index;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
}

function xml(parts: string[]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${parts.join("")}`;
}

function escapeXmlText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXmlAttribute(value: string) {
  return escapeXmlText(value).replaceAll("\"", "&quot;");
}
