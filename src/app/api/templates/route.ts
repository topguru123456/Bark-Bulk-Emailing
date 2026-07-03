import { NextResponse } from "next/server";
import { getAccounts } from "@/lib/accounts";
import {
  getAllTemplates,
  resetAllTemplates,
  resetTemplate,
  saveTemplate,
  type StoredTemplate,
} from "@/lib/templates-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = getAccounts();
  const templates = await getAllTemplates(accounts.map((a) => a.id));
  return NextResponse.json({ templates });
}

type PutRequest = {
  accountId: string;
  subject: string;
  body: string;
};

export async function PUT(request: Request) {
  let payload: PutRequest;
  try {
    payload = (await request.json()) as PutRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { accountId, subject, body } = payload;
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required." }, { status: 400 });
  }
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json(
      { error: "Subject and body are required." },
      { status: 400 },
    );
  }

  const account = getAccounts().find((a) => a.id === accountId);
  if (!account) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const template = await saveTemplate(accountId, { subject, body });
  return NextResponse.json({ template });
}

type PatchRequest = {
  accountId?: string;
  action: "reset" | "resetAll";
};

export async function PATCH(request: Request) {
  let payload: PatchRequest;
  try {
    payload = (await request.json()) as PatchRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (payload.action === "resetAll") {
    await resetAllTemplates();
    const accounts = getAccounts();
    const templates = await getAllTemplates(accounts.map((a) => a.id));
    return NextResponse.json({ templates });
  }

  if (payload.action !== "reset" || !payload.accountId) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const template: StoredTemplate = await resetTemplate(payload.accountId);
  return NextResponse.json({ template });
}
