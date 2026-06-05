import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConversation, markRead } from "@/lib/store";
import { readSettings } from "@/lib/settings";
import { sendMessage } from "@/lib/twilio";

export const dynamic = "force-dynamic";

const sendSchema = z.object({
  conversationId: z.string(),
  body: z.string().min(1).max(2000),
});

// POST: compose + send an outbound message into a conversation.
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const conv = getConversation(parsed.data.conversationId);
  if (!conv) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const settings = await readSettings();
  const result = await sendMessage({
    conversationId: conv.id,
    channel: conv.channel,
    to: conv.contactNumber,
    body: parsed.data.body,
    settings,
  });
  return NextResponse.json({ message: result.message, mode: result.mode });
}

// PATCH: mark a conversation read.
export async function PATCH(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const id = json?.conversationId;
  if (typeof id !== "string") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  markRead(id);
  return NextResponse.json({ ok: true });
}
