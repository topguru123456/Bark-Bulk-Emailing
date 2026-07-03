import { NextResponse } from "next/server";
import { getStorageBackend, isPersistentStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const backend = getStorageBackend();
  return NextResponse.json({
    backend,
    persistent: isPersistentStorage(),
    onVercel: !!process.env.VERCEL,
  });
}
