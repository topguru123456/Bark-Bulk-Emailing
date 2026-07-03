"use client";

import { formatJstDateTime } from "@/lib/datetime";
import type { CrossAccountWarning, DuplicateWarning } from "@/types/app";

type Props = {
  clientName: string;
  clientEmail: string;
  accountName: string;
  onCancel: () => void;
  onConfirm: () => void;
  sending: boolean;
} & (
  | { kind: "same-account"; warning: DuplicateWarning }
  | { kind: "cross-account"; warning: CrossAccountWarning }
);

export function DuplicateModal(props: Props) {
  const {
    clientName,
    clientEmail,
    accountName,
    onCancel,
    onConfirm,
    sending,
    kind,
    warning,
  } = props;

  const isCross = kind === "cross-account";

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
        <div
          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${
            isCross
              ? "bg-red-100 dark:bg-red-950/60"
              : "bg-amber-100 dark:bg-amber-950/60"
          }`}
        >
          <svg
            className={`h-6 w-6 ${
              isCross
                ? "text-red-600 dark:text-red-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
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
          {isCross
            ? "Another sender already contacted this client"
            : "Already emailed this client"}
        </h2>

        {isCross ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {clientName}
              </span>{" "}
              ({clientEmail}) already received email from{" "}
              {warning.otherSends.length === 1 ? "another" : "other"} account
              {warning.otherSends.length === 1 ? "" : "s"} in your team. Sending
              again as{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {accountName}
              </span>{" "}
              will look coordinated — recipients often recognize the same pitch
              from multiple people.
            </p>
            <ul className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              {warning.otherSends.map((s) => (
                <li
                  key={`${s.accountName}-${s.timeAgo}`}
                  className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-950"
                >
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {s.accountName}
                  </span>{" "}
                  · {s.timeAgo}
                  <br />
                  Subject: {s.subject}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-red-700 dark:text-red-400">
              Best practice: pick one account per client unless they asked for a
              follow-up from someone specific.
            </p>
          </>
        ) : (
          <>
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
          </>
        )}

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
            className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              isCross
                ? "bg-red-600 hover:bg-red-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {sending ? "Sending…" : "Send anyway"}
          </button>
        </div>
      </div>
    </div>
  );
}
