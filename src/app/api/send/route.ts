import { NextResponse } from "next/server";
import { getAccountById } from "@/lib/accounts";
import { addHistoryEntry } from "@/lib/history";
import { buildOutgoingMail, createGmailTransporter } from "@/lib/mail";
import { applyClientPlaceholders } from "@/lib/template";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type SendRequest = {
  accountId: string;
  subject: string;
  body: string;
  clientName: string;
  clientEmail: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let payload: SendRequest;
  try {
    payload = (await request.json()) as SendRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { accountId, subject, body, clientName, clientEmail } = payload;

  if (!accountId) {
    return NextResponse.json({ error: "No account selected." }, { status: 400 });
  }
  if (!clientName?.trim()) {
    return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  }
  const to = clientEmail?.trim();
  if (!to || !EMAIL_RE.test(to)) {
    return NextResponse.json(
      { error: "A valid client email address is required." },
      { status: 400 },
    );
  }
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json(
      { error: "Subject and body are required." },
      { status: 400 },
    );
  }

  const account = getAccountById(accountId);
  if (!account) {
    return NextResponse.json(
      { error: "Selected account was not found on the server." },
      { status: 404 },
    );
  }

  const transporter = createGmailTransporter(account);

  try {
    await transporter.verify();
  } catch (err) {
    const code = (err as { code?: string })?.code;
    const detail = err instanceof Error ? err.message : String(err);
    const isNetwork =
      code === "ETIMEDOUT" ||
      code === "ECONNREFUSED" ||
      code === "ESOCKET" ||
      code === "ECONNECTION" ||
      code === "ENOTFOUND" ||
      code === "EAI_AGAIN" ||
      code === "EDNS";
    const message = isNetwork
      ? `Could not reach Gmail's SMTP server (${code}). This is almost always a network block — many corporate, school, ISP, or VPN networks block outbound SMTP (ports 465/587). Try a different network (e.g. a phone hotspot) or a VPN. Details: ${detail}`
      : `Could not authenticate with Gmail. Check the account's 16-char App Password (and that 2-Step Verification is on). Details: ${detail}`;
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const name = clientName.trim();
  const personalSubject = applyClientPlaceholders(subject, name);
  const personalBody = applyClientPlaceholders(body, name);

  const mail = buildOutgoingMail({
    accountId: account.id,
    account: { name: account.name, email: account.email },
    to,
    subject: personalSubject,
    body: personalBody,
  });

  try {
    await transporter.sendMail(mail);
    transporter.close();

    const entry = await addHistoryEntry({
      accountId: account.id,
      accountName: account.name,
      accountEmail: account.email,
      clientName: name,
      clientEmail: to,
      subject: personalSubject,
    });

    return NextResponse.json({
      status: "sent" as const,
      to,
      from: account.email,
      historyEntry: entry,
    });
  } catch (err) {
    transporter.close();
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: "failed" as const, to, from: account.email, error },
      { status: 502 },
    );
  }
}
