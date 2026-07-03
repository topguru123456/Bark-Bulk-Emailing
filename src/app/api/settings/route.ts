import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  let body: { duplicateWarningDays?: number };
  try {
    body = (await request.json()) as { duplicateWarningDays?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const settings = await updateSettings(body);
    return NextResponse.json({ settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid settings.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
