"use client";

import { useMemo } from "react";
import {
  formatJstDayHeading,
  formatJstTime,
  toJstDateKey,
} from "@/lib/datetime";
import type { HistoryEntry } from "@/types/app";

type Props = {
  entries: HistoryEntry[];
  loading: boolean;
  onRefresh: () => void;
};

export function HistoryPanel({ entries, loading, onRefresh }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>();
    for (const entry of entries) {
      const key = toJstDateKey(entry.sentAt);
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
        Loading history…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-white py-16 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          No emails sent yet
        </p>
        <p className="max-w-xs text-center text-xs text-zinc-500 dark:text-zinc-400">
          Sent messages will appear here, grouped by day (JST).
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {entries.length} send{entries.length === 1 ? "" : "s"} · times shown
          in JST
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Refresh
        </button>
      </div>

      {grouped.map(([dateKey, dayEntries]) => (
        <section key={dateKey} className="flex flex-col gap-2">
          <h3 className="sticky top-0 z-10 bg-zinc-50 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            {formatJstDayHeading(dateKey)}
          </h3>
          <ul className="flex flex-col gap-2">
            {dayEntries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {entry.clientName}
                    </p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {entry.clientEmail}
                    </p>
                  </div>
                  <time
                    dateTime={entry.sentAt}
                    className="shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400"
                  >
                    {formatJstTime(entry.sentAt)}
                  </time>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <span>
                    From{" "}
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {entry.accountName}
                    </span>
                  </span>
                  <span className="hidden text-zinc-300 sm:inline dark:text-zinc-700">
                    ·
                  </span>
                  <span className="truncate">{entry.subject}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
