import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConversation } from "@/lib/store";
import { readSettings } from "@/lib/settings";
import { runAgent } from "@/lib/llm";

export const dynamic = "force-dynamic";

const schema = z.object({ conversationId: z.string() });

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const conv = getConversation(parsed.data.conversationId);
  if (!conv) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const settings = await readSettings();
  const configured = settings.aiProvider === "mock" || Boolean(settings.aiProvider && settings.aiKey);
  if (!configured) {
    return NextResponse.json({ error: "no_ai_key" }, { status: 412 });
  }
  try {
    const result = await runAgent(conv, settings);
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "agent_failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
