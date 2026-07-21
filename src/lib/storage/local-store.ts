import * as fs from "node:fs/promises";
import * as path from "node:path";

function dataDir() {
  return path.join(process.cwd(), ".local-data");
}

function filePath(name: string) {
  return path.join(dataDir(), name);
}

export async function ensureDataDir() {
  await fs.mkdir(dataDir(), { recursive: true });
}

export async function writeJsonFile<T>(name: string, value: T) {
  await ensureDataDir();
  await fs.writeFile(filePath(name), JSON.stringify(value, null, 2), "utf8");
}

export async function readJsonFile<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath(name), "utf8");

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
