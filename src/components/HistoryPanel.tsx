"use client";

import { useEffect, useMemo, useState } from "react";
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
  onDelete: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  autoRefresh?: boolean;
};

type DayTab = { id: string; label: string };

export function HistoryPanel({
  entries,
  loading,
  onRefresh,
  onDelete,
  onClearAll,
  autoRefresh = false,
}: Props) {
  const [activeDay, setActiveDay] = useState<string>("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const dayTabs = useMemo((): DayTab[] => {
    const keys = new Set<string>();
    for (const entry of entries) {
      keys.add(toJstDateKey(entry.sentAt));
    }
    const sorted = [...keys].sort((a, b) => b.localeCompare(a));
    return [
      { id: "all", label: "All" },
      ...sorted.map((key) => ({
        id: key,
        label: formatJstDayHeading(key),
      })),
    ];
  }, [entries]);

  const filtered = useMemo(() => {
    if (activeDay === "all") return entries;
    return entries.filter((e) => toJstDateKey(e.sentAt) === activeDay);
  }, [entries, activeDay]);

  const grouped = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>();
    for (const entry of filtered) {
      const key = toJstDateKey(entry.sentAt);
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(onRefresh, 15_000);
    return () => clearInterval(id);
  }, [autoRefresh, onRefresh]);

  async function handleClearAll() {
    setClearing(true);
    try {
      await onClearAll();
      setConfirmClear(false);
      setActiveDay("all");
    } finally {
      setClearing(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await onDelete(id);
      setPendingDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
        Loading history…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {confirmClear && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
            onClick={() => !clearing && setConfirmClear(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Clear all history?
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              This permanently removes {entries.length} send
              {entries.length === 1 ? "" : "s"}. Cannot be undone.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={clearing}
                onClick={() => setConfirmClear(false)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={handleClearAll}
                className="inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {clearing ? "Clearing…" : "Clear all"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 pt-4 pb-2 dark:border-zinc-800">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {entries.length} send{entries.length === 1 ? "" : "s"} · JST
            {autoRefresh && " · auto-refreshing"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Refresh
            </button>
            {entries.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {entries.length > 0 && (
          <div
            className="flex gap-1 overflow-x-auto px-3 pb-2"
            role="tablist"
            aria-label="History by day"
          >
            {dayTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeDay === tab.id}
                onClick={() => setActiveDay(tab.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeDay === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-white py-16 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            No emails sent yet
          </p>
          <p className="max-w-xs text-center text-xs text-zinc-500 dark:text-zinc-400">
            Sent messages appear here, grouped by day.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No sends on this day.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([dateKey, dayEntries]) => (
            <section key={dateKey} className="flex flex-col gap-2">
              {activeDay === "all" && (
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {formatJstDayHeading(dateKey)}
                </h3>
              )}
              <ul className="flex flex-col gap-2">
                {dayEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {entry.clientName}
                        </p>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {entry.clientEmail}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                          <span>
                            From{" "}
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                              {entry.accountName}
                            </span>
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-700">
                            ·
                          </span>
                          <span className="truncate">{entry.subject}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <time
                          dateTime={entry.sentAt}
                          className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400"
                        >
                          {formatJstTime(entry.sentAt)}
                        </time>
                        {pendingDeleteId === entry.id ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={deletingId === entry.id}
                              onClick={() => handleDelete(entry.id)}
                              className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                            >
                              {deletingId === entry.id ? "…" : "Yes"}
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === entry.id}
                              onClick={() => setPendingDeleteId(null)}
                              className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(entry.id)}
                            className="text-xs font-medium text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
