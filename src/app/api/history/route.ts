import { NextResponse } from "next/server";
import {
  clearHistory,
  deleteHistoryEntry,
  getHistoryEntries,
} from "@/lib/history";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await getHistoryEntries();
  return NextResponse.json({ entries });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const clearAll = searchParams.get("all");

  if (clearAll === "true") {
    await clearHistory();
    return NextResponse.json({ ok: true, cleared: true });
  }

  if (id) {
    const deleted = await deleteHistoryEntry(id);
    if (!deleted) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id });
  }

  return NextResponse.json(
    { error: "Provide ?id=... or ?all=true" },
    { status: 400 },
  );
}
