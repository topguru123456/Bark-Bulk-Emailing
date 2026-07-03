import { NextResponse } from "next/server";
import {
  findRecentSend,
  findSendsFromOtherAccounts,
  getHistoryEntries,
} from "@/lib/history";
import { getSettings } from "@/lib/settings";
import { formatTimeAgo } from "@/lib/datetime";

export const dynamic = "force-dynamic";

type CheckRequest = {
  accountId: string;
  clientEmail: string;
};

export async function POST(request: Request) {
  let payload: CheckRequest;
  try {
    payload = (await request.json()) as CheckRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { accountId, clientEmail } = payload;
  if (!accountId || !clientEmail?.trim()) {
    return NextResponse.json(
      { error: "accountId and clientEmail are required." },
      { status: 400 },
    );
  }

  const settings = await getSettings();
  const entries = await getHistoryEntries();
  const windowDays = settings.duplicateWarningDays;

  const recent = findRecentSend(entries, accountId, clientEmail, windowDays);
  const otherSends = findSendsFromOtherAccounts(
    entries,
    accountId,
    clientEmail,
    windowDays,
  );

  return NextResponse.json({
    shouldWarn: Boolean(recent),
    lastSend: recent ?? undefined,
    timeAgo: recent ? formatTimeAgo(recent.sentAt) : undefined,
    crossAccountWarn: otherSends.length > 0,
    otherSends: otherSends.map((e) => ({
      accountName: e.accountName,
      subject: e.subject,
      timeAgo: formatTimeAgo(e.sentAt),
    })),
  });
}
