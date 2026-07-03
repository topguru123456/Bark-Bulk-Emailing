import "server-only";
import fs from "fs/promises";
import path from "path";
import { Redis } from "@upstash/redis";
import { head, put } from "@vercel/blob";

const BLOB_PREFIX = "app-data";

export type StorageBackend = "redis" | "blob" | "local" | "none";

function hasRedis(): boolean {
  return !!(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
    (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
  );
}

function hasBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function isVercel(): boolean {
  return !!process.env.VERCEL;
}

let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = Redis.fromEnv();
  }
  return redisClient;
}

export function getStorageBackend(): StorageBackend {
  if (hasRedis()) return "redis";
  if (hasBlob()) return "blob";
  if (!isVercel()) return "local";
  return "none";
}

export function isPersistentStorage(): boolean {
  return getStorageBackend() !== "none";
}

function localDataDir(): string {
  return path.join(process.cwd(), "data");
}

function blobPath(filename: string): string {
  return `${BLOB_PREFIX}/${filename}`;
}

function redisKey(filename: string): string {
  return `app:${filename}`;
}

export async function readJsonFile<T>(
  filename: string,
  defaultValue: T,
): Promise<T> {
  const backend = getStorageBackend();

  if (backend === "redis") {
    const val = await getRedis().get<T>(redisKey(filename));
    return val ?? defaultValue;
  }

  if (backend === "blob") {
    try {
      const meta = await head(blobPath(filename));
      const res = await fetch(meta.url);
      if (!res.ok) return defaultValue;
      return (await res.json()) as T;
    } catch {
      return defaultValue;
    }
  }

  if (backend === "local") {
    const dir = localDataDir();
    await fs.mkdir(dir, { recursive: true });
    try {
      const raw = await fs.readFile(path.join(dir, filename), "utf-8");
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  return defaultValue;
}

export async function writeJsonFile<T>(
  filename: string,
  data: T,
): Promise<void> {
  const backend = getStorageBackend();

  if (backend === "redis") {
    await getRedis().set(redisKey(filename), data);
    return;
  }

  if (backend === "blob") {
    await put(blobPath(filename), JSON.stringify(data, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return;
  }

  if (backend === "local") {
    const dir = localDataDir();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, filename),
      JSON.stringify(data, null, 2),
      "utf-8",
    );
    return;
  }

  throw new Error(
    "Persistent storage is not configured. In Vercel, add Upstash Redis or Blob storage to this project and redeploy.",
  );
}
