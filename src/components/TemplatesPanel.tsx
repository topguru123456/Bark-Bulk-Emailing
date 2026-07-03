"use client";

import { useState } from "react";
import type { PublicAccount } from "@/types/app";

export type TemplateContent = {
  subject: string;
  body: string;
};

type Props = {
  accounts: PublicAccount[];
  templates: Record<string, TemplateContent>;
  activeAccountId: string;
  onSelectAccount: (id: string) => void;
  onUpdate: (accountId: string, patch: Partial<TemplateContent>) => void;
  onSave: (accountId: string) => Promise<void>;
  onReset: (accountId: string) => Promise<void>;
};

export function TemplatesPanel({
  accounts,
  templates,
  activeAccountId,
  onSelectAccount,
  onUpdate,
  onSave,
  onReset,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const active = accounts.find((a) => a.id === activeAccountId);
  const content = templates[activeAccountId];

  async function handleSave() {
    if (!content?.subject.trim() || !content?.body.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      await onSave(activeAccountId);
      setMessage("Template saved.");
    } catch {
      setMessage("Failed to save template.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    setMessage(null);
    try {
      await onReset(activeAccountId);
      setMessage("Reset to default template.");
    } catch {
      setMessage("Failed to reset template.");
    } finally {
      setResetting(false);
    }
  }

  if (!active || !content) return null;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-5 pt-5 pb-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Email templates
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Edit once, use every time you send. Changes are saved on the server.
        </p>
      </div>

      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div
          className="flex gap-0.5 overflow-x-auto px-2"
          role="tablist"
          aria-label="Template accounts"
        >
          {accounts.map((account) => {
            const isActive = account.id === activeAccountId;
            return (
              <button
                key={account.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  onSelectAccount(account.id);
                  setMessage(null);
                }}
                className={`shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-b-0 border-zinc-200 bg-white text-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-blue-400"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                }`}
              >
                {account.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 pb-5">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Template for{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {active.email}
          </span>
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Subject
          </span>
          <input
            type="text"
            value={content.subject}
            onChange={(e) =>
              onUpdate(activeAccountId, { subject: e.target.value })
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Message
          </span>
          <textarea
            value={content.body}
            onChange={(e) => onUpdate(activeAccountId, { body: e.target.value })}
            rows={16}
            className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-relaxed text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Use <code>{"{Clientname}"}</code> for the first name. Each account has
          a different voice (formal / casual / P.E. engineering-only) — reset
          to default to load the latest version.
        </p>

        {message && (
          <p
            className={`text-sm ${
              message.includes("Failed")
                ? "text-red-600 dark:text-red-400"
                : "text-green-700 dark:text-green-400"
            }`}
          >
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !content.subject.trim() || !content.body.trim()}
            className="inline-flex h-10 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save template"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {resetting ? "Resetting…" : "Reset to default"}
          </button>
        </div>
      </div>
    </section>
  );
}
