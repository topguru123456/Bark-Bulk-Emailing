"use client";

import { useEffect, useState } from "react";
import type { AppSettings } from "@/types/app";

type Props = {
  settings: AppSettings;
  onSaved: (settings: AppSettings) => void;
};

type StorageStatus = {
  backend: string;
  persistent: boolean;
};

export function SettingsPanel({ settings, onSaved }: Props) {
  const [days, setDays] = useState(String(settings.duplicateWarningDays));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageStatus | null>(null);

  useEffect(() => {
    setDays(String(settings.duplicateWarningDays));
  }, [settings.duplicateWarningDays]);

  useEffect(() => {
    fetch("/api/storage/status")
      .then((r) => r.json())
      .then(setStorage)
      .catch(() => setStorage(null));
  }, []);

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

      <div
        className={`rounded-lg px-4 py-3 ${
          storage?.persistent
            ? "bg-green-50 dark:bg-green-950/30"
            : "bg-amber-50 dark:bg-amber-950/30"
        }`}
      >
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Data storage
          {storage && (
            <span className="ml-2 font-normal text-zinc-500">
              ({storage.backend}
              {storage.persistent ? " · saved" : " · not saved"})
            </span>
          )}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          History, templates, and settings all use the same storage. On Vercel
          you need a database — the server filesystem is read-only.
        </p>
        {!storage?.persistent && (
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-zinc-600 dark:text-zinc-400">
            <li>
              Open your Vercel project → <strong>Storage</strong>
            </li>
            <li>
              Add <strong>Upstash Redis</strong> or <strong>Blob</strong>, connect
              to this project
            </li>
            <li>
              Ensure <code>BLOB_READ_WRITE_TOKEN</code> is in Vercel → Settings →
              Environment Variables (all environments)
            </li>
            <li>Redeploy after adding storage or env vars</li>
          </ol>
        )}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/30">
        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
          Inbox placement (avoid spam)
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Emails sent through this app use Gmail SMTP from a server, not the
          Gmail website. Filters treat that differently from mail you send
          manually — even from the same account.
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs text-zinc-600 dark:text-zinc-400">
          <li>
            <strong>Warm up each account</strong> — start with a few sends per
            day, then increase slowly. Sudden volume spikes hurt trust.
          </li>
          <li>
            <strong>Approved copy matters most</strong> — defaults stay close to
            your proven Bark project wording. Avoid adding emojis, fake reply
            prefixes, or aggressive sales hooks.
          </li>
          <li>
            <strong>Duplicate warning</strong> — the app only warns when the
            same account emails the same client again within your configured
            window.
          </li>
          <li>
            <strong>Ask recipients to reply</strong> — a reply strongly signals
            legitimacy to Gmail.
          </li>
          <li>
            <strong>Monitor Postmaster Tools</strong> —{" "}
            <a
              href="https://postmaster.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline dark:text-blue-400"
            >
              postmaster.google.com
            </a>{" "}
            shows spam rates per account/domain.
          </li>
          <li>
            Keep each send near plain text: one clear service angle, one reply
            request, no fake reply prefixes, no emoji, no hidden body rewriting.
          </li>
        </ul>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
          Reset templates after a copy update; saved templates keep their old
          text until you reset them.
        </p>
      </div>

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
