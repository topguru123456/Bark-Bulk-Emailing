import { NextResponse } from "next/server";
import { getHistoryEntries } from "@/lib/history";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await getHistoryEntries();
  return NextResponse.json({ entries });
}
