// AI agent layer (BYOK via Vercel AI SDK).
//
//   - provider "openai" | "anthropic": build the model from the visitor's own
//     key (read server-side from the encrypted cookie) and run generateObject
//     against a zod schema.
//   - provider "mock": a deterministic sentinel used by Playwright tests and by
//     anyone who wants to see the agent UX without a key. Returns canned,
//     thread-aware output WITHOUT calling any provider.
//
// The deployer's own env keys are never read here, so the hosted demo can
// never bill the owner.

import "server-only";
import { z } from "zod";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { Conversation, Settings } from "./types";

export const agentSchema = z.object({
  suggestedReply: z.string(),
  summary: z.string(),
  intent: z.string(),
  nextAction: z.string(),
});

export type AgentResult = z.infer<typeof agentSchema>;

function transcript(conv: Conversation): string {
  return conv.messages
    .map((m) => {
      const who = m.direction === "inbound" ? conv.contactName : "Agent";
      const text = m.voice ? `[call] ${m.voice.transcript}` : m.body;
      return `${who}: ${text}`;
    })
    .join("\n");
}

const SYSTEM_PROMPT = `You are Relay, an AI agent inside a CPaaS messaging console.
You help a support/sales operator handle SMS, Voice, and RCS conversations.
Given a conversation transcript, produce:
- suggestedReply: a concise, friendly, ready-to-send reply from the operator (1-3 sentences).
- summary: a one-sentence summary of the conversation state.
- intent: the customer's primary intent in 1-4 words (e.g. "schedule demo", "billing dispute").
- nextAction: the single best next action for the operator in a short imperative phrase.`;

function mockResult(conv: Conversation): AgentResult {
  const last = [...conv.messages].reverse().find((m) => m.direction === "inbound");
  const lastText = last?.voice?.transcript ?? last?.body ?? "the latest message";
  return {
    suggestedReply: `Thanks for reaching out, ${conv.contactName.split(" ")[0]}! Happy to help with that — here's what I can do next.`,
    summary: `${conv.contactName} (${conv.channel.toUpperCase()}): ${truncate(lastText, 90)}`,
    intent: inferIntent(lastText),
    nextAction: "Send the suggested reply and confirm details.",
  };
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function inferIntent(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("pricing") || t.includes("invoice") || t.includes("charge")) return "billing inquiry";
  if (t.includes("reschedule") || t.includes("thursday") || t.includes("time")) return "schedule meeting";
  if (t.includes("port") || t.includes("sip") || t.includes("trunk")) return "telecom support";
  return "general inquiry";
}

function buildModel(settings: Settings) {
  if (settings.aiProvider === "openai") {
    const openai = createOpenAI({ apiKey: settings.aiKey });
    return openai(settings.aiModel || "gpt-4o-mini");
  }
  if (settings.aiProvider === "anthropic") {
    const anthropic = createAnthropic({ apiKey: settings.aiKey });
    return anthropic(settings.aiModel || "claude-3-5-haiku-latest");
  }
  return null;
}

export async function runAgent(
  conv: Conversation,
  settings: Settings,
): Promise<AgentResult> {
  // Mock sentinel: deterministic, no network.
  if (settings.aiProvider === "mock") {
    return mockResult(conv);
  }

  const model = buildModel(settings);
  if (!model) {
    throw new Error("no_ai_key");
  }

  const { object } = await generateObject({
    model,
    schema: agentSchema,
    system: SYSTEM_PROMPT,
    prompt: `Conversation with ${conv.contactName} on channel ${conv.channel.toUpperCase()}:\n\n${transcript(conv)}`,
  });
  return object;
}
