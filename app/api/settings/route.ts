import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSettings, writeSettings, toPublic, DEFAULT_SETTINGS } from "@/lib/settings";
import type { Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

const schema = z.object({
  mode: z.enum(["simulator", "live"]).optional(),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioFrom: z.string().optional(),
  aiProvider: z.enum(["openai", "anthropic", "mock"]).optional(),
  aiKey: z.string().optional(),
  aiModel: z.string().optional(),
  clear: z.boolean().optional(),
});

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json({ settings: toPublic(settings) });
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (parsed.data.clear) {
    await writeSettings(DEFAULT_SETTINGS);
    return NextResponse.json({ settings: toPublic(DEFAULT_SETTINGS) });
  }

  const current = await readSettings();
  // Merge: empty strings clear a field; undefined leaves it unchanged.
  const next: Settings = { ...current };
  const d = parsed.data;
  if (d.mode !== undefined) next.mode = d.mode;
  applyField(next, "twilioAccountSid", d.twilioAccountSid);
  applyField(next, "twilioAuthToken", d.twilioAuthToken);
  applyField(next, "twilioFrom", d.twilioFrom);
  if (d.aiProvider !== undefined) next.aiProvider = d.aiProvider;
  applyField(next, "aiKey", d.aiKey);
  applyField(next, "aiModel", d.aiModel);

  await writeSettings(next);
  return NextResponse.json({ settings: toPublic(next) });
}

function applyField<K extends keyof Settings>(
  target: Settings,
  key: K,
  value: string | undefined,
): void {
  if (value === undefined) return;
  if (value === "") {
    delete target[key];
  } else {
    target[key] = value as Settings[K];
  }
}
