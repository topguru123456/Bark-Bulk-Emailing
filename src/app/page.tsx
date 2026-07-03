"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DuplicateModal } from "@/components/DuplicateModal";
import { HistoryPanel } from "@/components/HistoryPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import {
  TemplatesPanel,
  type TemplateContent,
} from "@/components/TemplatesPanel";
import { getTemplateForAccount } from "@/lib/template";
import type {
  AppSettings,
  DuplicateWarning,
  HistoryEntry,
  PublicAccount,
} from "@/types/app";

type SendStatus =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent"; to: string }
  | { state: "failed"; error: string };

type MainTab = "send" | "templates" | "history" | "settings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: "send", label: "Send" },
  { id: "templates", label: "Templates" },
  { id: "history", label: "History" },
  { id: "settings", label: "Settings" },
];

function factoryTemplate(accountId: string): TemplateContent {
  const t = getTemplateForAccount(accountId);
  return { subject: t.defaultSubject, body: t.defaultBody };
}

export default function Home() {
  const [mainTab, setMainTab] = useState<MainTab>("send");
  const [accounts, setAccounts] = useState<PublicAccount[]>([]);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [templateAccountId, setTemplateAccountId] = useState<string>("");

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [templates, setTemplates] = useState<Record<string, TemplateContent>>(
    {},
  );
  const [sendStatus, setSendStatus] = useState<Record<string, SendStatus>>({});

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [settings, setSettings] = useState<AppSettings>({
    duplicateWarningDays: 15,
  });

  const [duplicateModal, setDuplicateModal] = useState<{
    warning: DuplicateWarning;
    account: PublicAccount;
  } | null>(null);

  const [storageOk, setStorageOk] = useState<boolean | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
    } catch {
      /* keep existing */
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(data.entries ?? []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch {
      /* keep defaults */
    }
  }, []);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: { accounts: PublicAccount[] }) => {
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setTemplateAccountId(data.accounts[0].id);
        }
        if (data.accounts.length === 0) {
          setAccountsError(
            "No accounts configured. Add them to .env.local and restart the dev server.",
          );
        }
      })
      .catch(() => setAccountsError("Failed to load accounts from the server."));

    loadTemplates();
    loadHistory();
    loadSettings();

    fetch("/api/storage/status")
      .then((r) => r.json())
      .then((data: { persistent?: boolean }) => setStorageOk(!!data.persistent))
      .catch(() => setStorageOk(null));
  }, [loadTemplates, loadHistory, loadSettings]);

  useEffect(() => {
    if (!duplicateModal) return;
    const modalAccountId = duplicateModal.account.id;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && sendStatus[modalAccountId]?.state !== "sending") {
        setDuplicateModal(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [duplicateModal, sendStatus]);

  function updateTemplateLocal(
    accountId: string,
    patch: Partial<TemplateContent>,
  ) {
    setTemplates((prev) => ({
      ...prev,
      [accountId]: { ...prev[accountId], ...patch },
    }));
  }

  async function saveTemplate(accountId: string) {
    const content = templates[accountId];
    if (!content) throw new Error("No template");
    const res = await fetch("/api/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        subject: content.subject,
        body: content.body,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Save failed");
    }
    const data = await res.json();
    setTemplates((prev) => ({ ...prev, [accountId]: data.template }));
  }

  async function resetTemplate(accountId: string) {
    const res = await fetch("/api/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, action: "reset" }),
    });
    if (!res.ok) throw new Error("Reset failed");
    const data = await res.json();
    setTemplates((prev) => ({ ...prev, [accountId]: data.template }));
  }

  const clientReady =
    clientName.trim().length > 0 && EMAIL_RE.test(clientEmail.trim());

  const mergedTemplates = useMemo(() => {
    const merged: Record<string, TemplateContent> = { ...templates };
    for (const account of accounts) {
      if (!merged[account.id]) {
        merged[account.id] = factoryTemplate(account.id);
      }
    }
    return merged;
  }, [templates, accounts]);

  async function executeSend(account: PublicAccount) {
    const content = mergedTemplates[account.id];
    if (!content.subject.trim() || !content.body.trim()) return;

    setSendStatus((prev) => ({
      ...prev,
      [account.id]: { state: "sending" },
    }));

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.id,
          subject: content.subject,
          body: content.body,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok && data.status === "sent") {
        setSendStatus((prev) => ({
          ...prev,
          [account.id]: { state: "sent", to: data.to },
        }));
        if (data.historyEntry) {
          setHistory((prev) => [data.historyEntry, ...prev]);
        } else {
          loadHistory();
        }
        setDuplicateModal(null);
      } else {
        setSendStatus((prev) => ({
          ...prev,
          [account.id]: {
            state: "failed",
            error: data.error || "Sending failed.",
          },
        }));
      }
    } catch (err) {
      setSendStatus((prev) => ({
        ...prev,
        [account.id]: {
          state: "failed",
          error: err instanceof Error ? err.message : "Network error.",
        },
      }));
    }
  }

  async function handleSend(account: PublicAccount) {
    if (!clientReady) return;

    const content = mergedTemplates[account.id];
    if (!content.subject.trim() || !content.body.trim()) return;

    try {
      const res = await fetch("/api/history/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.id,
          clientEmail: clientEmail.trim(),
        }),
      });
      const data = await res.json();

      if (data.shouldWarn && data.lastSend) {
        setDuplicateModal({
          account,
          warning: { lastSend: data.lastSend, timeAgo: data.timeAgo },
        });
        return;
      }
    } catch {
      /* proceed without warning on check failure */
    }

    await executeSend(account);
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 font-sans dark:bg-zinc-950">
      {duplicateModal && (
        <DuplicateModal
          warning={duplicateModal.warning}
          clientName={clientName.trim()}
          clientEmail={clientEmail.trim()}
          accountName={duplicateModal.account.name}
          onCancel={() => setDuplicateModal(null)}
          onConfirm={() => executeSend(duplicateModal.account)}
          sending={
            sendStatus[duplicateModal.account.id]?.state === "sending"
          }
        />
      )}

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Bark Project Email Sender
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Enter client details and send — templates are ready to go.
            </p>
          </div>
          <span className="rounded-full bg-zinc-200/80 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            JST
          </span>
        </header>

        {storageOk === false && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="font-medium">History and templates are not being saved</p>
            <p className="mt-1 text-xs opacity-90">
              Add <span className="font-medium">Upstash Redis</span> or{" "}
              <span className="font-medium">Blob</span> storage in your Vercel
              project (Storage tab), then redeploy. See Settings for steps.
            </p>
          </div>
        )}

        <nav
          className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
          aria-label="Main"
        >
          {MAIN_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMainTab(tab.id)}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
                mainTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              {tab.label}
              {tab.id === "history" && history.length > 0 && (
                <span
                  className={`ml-1.5 text-xs ${
                    mainTab === tab.id
                      ? "text-blue-100"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {history.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {mainTab === "send" && (
          <>
            <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Client
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Name
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. John Smith"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      setSendStatus({});
                    }}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Email
                  </span>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={clientEmail}
                    onChange={(e) => {
                      setClientEmail(e.target.value);
                      setSendStatus({});
                    }}
                    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 ${
                      clientEmail && !EMAIL_RE.test(clientEmail.trim())
                        ? "border-red-400 dark:border-red-500"
                        : "border-zinc-300"
                    }`}
                  />
                </label>
              </div>
              {!clientReady && (clientName || clientEmail) && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Enter a valid client name and email to send.
                </p>
              )}
            </section>

            {accountsError ? (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {accountsError}
              </p>
            ) : (
              <section className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
                <p className="px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Send from
                </p>
                <ul className="flex flex-col gap-2">
                  {accounts.map((account) => {
                    const status = sendStatus[account.id] ?? { state: "idle" };
                    const content = mergedTemplates[account.id];
                    const canSend =
                      clientReady &&
                      content.subject.trim() &&
                      content.body.trim() &&
                      status.state !== "sending";

                    return (
                      <li
                        key={account.id}
                        className="flex flex-col gap-2 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {account.name}
                          </p>
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {account.email}
                          </p>
                          {status.state === "sent" && (
                            <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                              Sent to {status.to}
                            </p>
                          )}
                          {status.state === "failed" && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                              {status.error}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSend(account)}
                          disabled={!canSend}
                          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:disabled:bg-zinc-700 sm:min-w-[7rem]"
                        >
                          {status.state === "sending" ? "Sending…" : "Send"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}

        {mainTab === "templates" && !accountsError && accounts.length > 0 && (
          <TemplatesPanel
            accounts={accounts}
            templates={mergedTemplates}
            activeAccountId={templateAccountId}
            onSelectAccount={setTemplateAccountId}
            onUpdate={updateTemplateLocal}
            onSave={saveTemplate}
            onReset={resetTemplate}
          />
        )}

        {mainTab === "history" && (
          <HistoryPanel
            entries={history}
            loading={historyLoading}
            onRefresh={loadHistory}
          />
        )}

        {mainTab === "settings" && (
          <SettingsPanel settings={settings} onSaved={setSettings} />
        )}
      </main>
    </div>
  );
}
