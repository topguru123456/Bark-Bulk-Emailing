import "server-only";
import fs from "fs/promises";
import path from "path";
import { head, put } from "@vercel/blob";

const BLOB_PREFIX = "app-data";

type StorageBackend = "blob" | "local";

function backend(): StorageBackend {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  return "local";
}

/** Writable directory for local dev and serverless fallback. */
function localDataDir(): string {
  if (process.env.VERCEL) return path.join("/tmp", "data");
  return path.join(process.cwd(), "data");
}

function blobPath(filename: string): string {
  return `${BLOB_PREFIX}/${filename}`;
}

export async function readJsonFile<T>(
  filename: string,
  defaultValue: T,
): Promise<T> {
  if (backend() === "blob") {
    try {
      const meta = await head(blobPath(filename));
      const res = await fetch(meta.url);
      if (!res.ok) return defaultValue;
      return (await res.json()) as T;
    } catch {
      return defaultValue;
    }
  }

  const dir = localDataDir();
  await fs.mkdir(dir, { recursive: true });
  try {
    const raw = await fs.readFile(path.join(dir, filename), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export async function writeJsonFile<T>(
  filename: string,
  data: T,
): Promise<void> {
  if (backend() === "blob") {
    await put(blobPath(filename), JSON.stringify(data, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  const dir = localDataDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, filename),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}

/** True when deployed without persistent blob storage (history may not survive). */
export function isEphemeralStorage(): boolean {
  return !!process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN;
}
