import { NextRequest, NextResponse } from "next/server";
import { readSettings } from "@/lib/settings";
import { verifyTwilioSignature } from "@/lib/twilio";
import {
  appendMessage,
  getConversationByNumber,
  listConversations,
} from "@/lib/store";
import type { Channel, Message } from "@/lib/types";

export const dynamic = "force-dynamic";

// Twilio inbound webhook. Twilio posts application/x-www-form-urlencoded.
// We MUST verify X-Twilio-Signature over the exact request URL + params BEFORE
// doing anything with the payload — missing/invalid signature => 403.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    params[k] = typeof v === "string" ? v : "";
  }

  const settings = await readSettings();
  const signature = req.headers.get("x-twilio-signature");
  // Twilio signs against the public URL it called. Prefer forwarded headers so
  // verification works behind a proxy/tunnel; fall back to the request URL.
  const url = publicUrl(req);

  const valid = verifyTwilioSignature({
    authToken: settings.twilioAuthToken,
    signature,
    url,
    params,
  });

  if (!valid) {
    return new NextResponse("Invalid Twilio signature", { status: 403 });
  }

  const from = params.From ?? "";
  const body = params.Body ?? "";
  const channel = detectChannel(params);

  // Route to an existing conversation by number, else the first conversation.
  const conv =
    getConversationByNumber(from) ?? listConversations()[0];
  if (!conv) {
    return new NextResponse("No conversation", { status: 404 });
  }

  const msg: Message = {
    id: `in_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    conversationId: conv.id,
    channel: channel ?? conv.channel,
    direction: "inbound",
    body,
    status: "received",
    createdAt: new Date().toISOString(),
    providerSid: params.MessageSid || params.SmsSid || undefined,
  };
  appendMessage(conv.id, msg);

  // Twilio expects TwiML or an empty 200.
  return new NextResponse("<Response></Response>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function detectChannel(params: Record<string, string>): Channel | undefined {
  if (params.MessageType === "rcs" || params.From?.startsWith("rcs:")) return "rcs";
  if (params.CallSid) return "voice";
  if (params.MessageSid || params.SmsSid || params.Body) return "sms";
  return undefined;
}

function publicUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (proto && host) {
    return `${proto}://${host}${req.nextUrl.pathname}${req.nextUrl.search}`;
  }
  return req.url;
}
