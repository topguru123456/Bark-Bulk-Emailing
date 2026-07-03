import "server-only";
import { readJsonFile, writeJsonFile } from "@/lib/storage";
import type { HistoryEntry } from "@/types/app";

export type { HistoryEntry };

type HistoryStore = {
  entries: HistoryEntry[];
};

const FILENAME = "send-history.json";

async function loadStore(): Promise<HistoryStore> {
  return readJsonFile<HistoryStore>(FILENAME, { entries: [] });
}

async function saveStore(store: HistoryStore): Promise<void> {
  await writeJsonFile(FILENAME, store);
}

export async function getHistoryEntries(): Promise<HistoryEntry[]> {
  const store = await loadStore();
  return store.entries.sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  );
}

export async function addHistoryEntry(
  entry: Omit<HistoryEntry, "id" | "sentAt">,
): Promise<HistoryEntry> {
  const store = await loadStore();
  const record: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    sentAt: new Date().toISOString(),
  };
  store.entries.push(record);
  await saveStore(store);
  return record;
}

export async function deleteHistoryEntry(id: string): Promise<boolean> {
  const store = await loadStore();
  const before = store.entries.length;
  store.entries = store.entries.filter((e) => e.id !== id);
  if (store.entries.length === before) return false;
  await saveStore(store);
  return true;
}

export async function clearHistory(): Promise<void> {
  await saveStore({ entries: [] });
}

/** Most recent send to this client from this account within the window, if any. */
export function findRecentSend(
  entries: HistoryEntry[],
  accountId: string,
  clientEmail: string,
  withinDays: number,
): HistoryEntry | null {
  const normalized = clientEmail.trim().toLowerCase();
  const cutoff = Date.now() - withinDays * 24 * 60 * 60 * 1000;

  const match = entries
    .filter(
      (e) =>
        e.accountId === accountId &&
        e.clientEmail.trim().toLowerCase() === normalized &&
        new Date(e.sentAt).getTime() >= cutoff,
    )
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  return match[0] ?? null;
}

/** Sends to this client from a different account within the window. */
export function findSendsFromOtherAccounts(
  entries: HistoryEntry[],
  accountId: string,
  clientEmail: string,
  withinDays: number,
): HistoryEntry[] {
  const normalized = clientEmail.trim().toLowerCase();
  const cutoff = Date.now() - withinDays * 24 * 60 * 60 * 1000;

  return entries
    .filter(
      (e) =>
        e.accountId !== accountId &&
        e.clientEmail.trim().toLowerCase() === normalized &&
        new Date(e.sentAt).getTime() >= cutoff,
    )
    .sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    );
}
