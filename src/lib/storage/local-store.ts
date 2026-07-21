import * as fs from "node:fs/promises";
import * as path from "node:path";

function dataDir() {
  return path.join(process.cwd(), ".local-data");
}

function filePath(name: string) {
  return path.join(dataDir(), validateJsonFileName(name));
}

export async function ensureDataDir() {
  await fs.mkdir(dataDir(), { recursive: true });
}

export async function writeJsonFile<T>(name: string, value: T) {
  const targetPath = filePath(name);

  await ensureDataDir();
  await fs.writeFile(targetPath, JSON.stringify(value, null, 2), "utf8");
}

export async function readJsonFile<T>(name: string, fallback: T): Promise<T> {
  const targetPath = filePath(name);

  try {
    const raw = await fs.readFile(targetPath, "utf8");

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function validateJsonFileName(name: string) {
  if (
    !name.endsWith(".json") ||
    name.includes("..") ||
    name.includes("/") ||
    name.includes("\\") ||
    path.isAbsolute(name)
  ) {
    throw new Error(
      "本地 JSON 文件名无效，只能使用 .local-data 下的安全 .json 文件名。"
    );
  }

  return name;
}
