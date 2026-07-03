import { NextResponse } from "next/server";
import { findRecentSend, getHistoryEntries } from "@/lib/history";
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
  const recent = findRecentSend(
    entries,
    accountId,
    clientEmail,
    settings.duplicateWarningDays,
  );

  if (!recent) {
    return NextResponse.json({ shouldWarn: false });
  }

  return NextResponse.json({
    shouldWarn: true,
    lastSend: recent,
    timeAgo: formatTimeAgo(recent.sentAt),
  });
}
