import "server-only";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readJsonFile<T>(
  filename: string,
  defaultValue: T,
): Promise<T> {
  await ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filepath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export async function writeJsonFile<T>(
  filename: string,
  data: T,
): Promise<void> {
  await ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), "utf-8");
}
