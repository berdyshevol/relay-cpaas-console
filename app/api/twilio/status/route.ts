import { NextRequest, NextResponse } from "next/server";
import { readSettings } from "@/lib/settings";
import { verifyTwilioSignature } from "@/lib/twilio";
import { updateMessageStatusBySid } from "@/lib/store";
import type { DeliveryStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// Twilio status-callback handler. Same signature contract as inbound, then
// updates the matching outbound message's delivery status by its provider SID.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    params[k] = typeof v === "string" ? v : "";
  }

  const settings = await readSettings();
  const signature = req.headers.get("x-twilio-signature");
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

  const sid = params.MessageSid || params.SmsSid || params.CallSid;
  const status = normalizeStatus(params.MessageStatus || params.SmsStatus || params.CallStatus);
  if (sid && status) {
    updateMessageStatusBySid(sid, status);
  }
  return new NextResponse(null, { status: 204 });
}

function normalizeStatus(raw: string | undefined): DeliveryStatus | undefined {
  switch (raw) {
    case "queued":
    case "sent":
    case "delivered":
    case "failed":
      return raw;
    case "read":
      return "read";
    case "undelivered":
      return "failed";
    default:
      return undefined;
  }
}

function publicUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (proto && host) {
    return `${proto}://${host}${req.nextUrl.pathname}${req.nextUrl.search}`;
  }
  return req.url;
}
