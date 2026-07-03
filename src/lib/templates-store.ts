import "server-only";
import { getTemplateForAccount } from "@/lib/template";
import { readJsonFile, writeJsonFile } from "@/lib/storage";

export type StoredTemplate = {
  subject: string;
  body: string;
};

type TemplateStore = {
  accounts: Record<string, StoredTemplate>;
};

const FILENAME = "templates.json";

async function loadStore(): Promise<TemplateStore> {
  return readJsonFile<TemplateStore>(FILENAME, { accounts: {} });
}

function factoryTemplate(accountId: string): StoredTemplate {
  const t = getTemplateForAccount(accountId);
  return { subject: t.defaultSubject, body: t.defaultBody };
}

export async function getTemplate(accountId: string): Promise<StoredTemplate> {
  const store = await loadStore();
  return store.accounts[accountId] ?? factoryTemplate(accountId);
}

export async function getAllTemplates(
  accountIds: string[],
): Promise<Record<string, StoredTemplate>> {
  const store = await loadStore();
  const result: Record<string, StoredTemplate> = {};
  for (const id of accountIds) {
    result[id] = store.accounts[id] ?? factoryTemplate(id);
  }
  return result;
}

export async function saveTemplate(
  accountId: string,
  template: StoredTemplate,
): Promise<StoredTemplate> {
  const store = await loadStore();
  store.accounts[accountId] = {
    subject: template.subject.trim(),
    body: template.body.trim(),
  };
  await writeJsonFile(FILENAME, store);
  return store.accounts[accountId];
}

export async function resetTemplate(accountId: string): Promise<StoredTemplate> {
  const store = await loadStore();
  delete store.accounts[accountId];
  await writeJsonFile(FILENAME, store);
  return factoryTemplate(accountId);
}

export async function resetAllTemplates(): Promise<void> {
  await writeJsonFile(FILENAME, { accounts: {} });
}
