"use client";

import { useEffect, useState } from "react";
import type { AppSettings } from "@/types/app";

type Props = {
  settings: AppSettings;
  onSaved: (settings: AppSettings) => void;
};

export function SettingsPanel({ settings, onSaved }: Props) {
  const [days, setDays] = useState(String(settings.duplicateWarningDays));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDays(String(settings.duplicateWarningDays));
  }, [settings.duplicateWarningDays]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const parsed = Number(days);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 365) {
      setError("Enter a number between 0 and 365.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicateWarningDays: parsed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save settings.");
      } else {
        onSaved(data.settings);
        setMessage("Settings saved.");
      }
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Duplicate send warning
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          When you try to email a client you already contacted from the same
          account within this period, a confirmation dialog appears. Set to{" "}
          <code className="text-xs">0</code> to disable warnings.
        </p>
      </div>

      <label className="flex max-w-xs flex-col gap-1.5">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Warn if last send was within (days)
        </span>
        <input
          type="number"
          min={0}
          max={365}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </label>

      <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Timezone
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Japan Standard Time (JST, UTC+9)
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          History dates and duplicate-send timestamps are shown in JST.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {message && (
        <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex h-10 w-fit items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
