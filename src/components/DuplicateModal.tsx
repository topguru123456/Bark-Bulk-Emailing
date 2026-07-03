"use client";

import { formatJstDateTime } from "@/lib/datetime";
import type { DuplicateWarning } from "@/types/app";

type Props = {
  warning: DuplicateWarning;
  clientName: string;
  clientEmail: string;
  accountName: string;
  onCancel: () => void;
  onConfirm: () => void;
  sending: boolean;
};

export function DuplicateModal({
  warning,
  clientName,
  clientEmail,
  accountName,
  onCancel,
  onConfirm,
  sending,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-modal-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
        onClick={onCancel}
        disabled={sending}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
          <svg
            className="h-6 w-6 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h2
          id="duplicate-modal-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Already emailed this client
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          You sent an email to{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {clientName}
          </span>{" "}
          ({clientEmail}) as{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {accountName}
          </span>{" "}
          <span className="font-medium text-amber-700 dark:text-amber-400">
            {warning.timeAgo}
          </span>
          .
        </p>

        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
          Last sent: {formatJstDateTime(warning.lastSend.sentAt)}
          <br />
          Subject: {warning.lastSend.subject}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={sending}
            className="inline-flex h-10 items-center justify-center rounded-full bg-amber-600 px-5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send anyway"}
          </button>
        </div>
      </div>
    </div>
  );
}
