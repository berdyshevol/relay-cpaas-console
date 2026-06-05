// Twilio integration. Real SDK usage, but safe by default:
//   - MODE=simulator (default): record an outbound message locally and
//     progress its delivery status queued -> sent -> delivered on a timer.
//     No credentials required, nothing leaves the process.
//   - MODE=live: send through the Twilio REST API using the visitor's BYOK
//     credentials read from the encrypted server-only cookie.

import "server-only";
import twilio from "twilio";
import type { Channel, Message, Settings } from "./types";
import { appendMessage, updateMessageStatus } from "./store";

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface SendInput {
  conversationId: string;
  channel: Channel;
  to: string;
  body: string;
  settings: Settings;
}

export interface SendResult {
  message: Message;
  mode: Settings["mode"];
}

// Drives queued -> sent -> delivered for a simulated outbound message.
// Kept short so the demo feels live; status is read by the client via polling.
function simulateDeliveryProgression(messageId: string): void {
  const steps: Array<[Message["status"], number]> = [
    ["sent", 600],
    ["delivered", 1600],
  ];
  for (const [status, delay] of steps) {
    setTimeout(() => updateMessageStatus(messageId, status), delay);
  }
}

export async function sendMessage(input: SendInput): Promise<SendResult> {
  const { conversationId, channel, to, body, settings } = input;
  const base: Message = {
    id: newId("out"),
    conversationId,
    channel,
    direction: "outbound",
    body,
    status: "queued",
    createdAt: new Date().toISOString(),
  };

  if (
    settings.mode === "live" &&
    settings.twilioAccountSid &&
    settings.twilioAuthToken &&
    settings.twilioFrom
  ) {
    const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);
    const res = await client.messages.create({
      to,
      from: settings.twilioFrom,
      body,
    });
    base.providerSid = res.sid;
    base.status = (res.status as Message["status"]) ?? "queued";
    appendMessage(conversationId, base);
    return { message: base, mode: "live" };
  }

  // Simulator path (default).
  appendMessage(conversationId, base);
  simulateDeliveryProgression(base.id);
  return { message: base, mode: "simulator" };
}

export { verifyTwilioSignature, signSimulatorRequest, SIMULATOR_TOKEN } from "./twilio-sign";
