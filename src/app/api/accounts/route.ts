import { NextResponse } from "next/server";
import { getAccounts, toPublicAccount } from "@/lib/accounts";

// Always read fresh from env at request time.
export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = getAccounts().map(toPublicAccount);
  return NextResponse.json({ accounts });
}
