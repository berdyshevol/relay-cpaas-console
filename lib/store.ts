// In-memory store kept on globalThis so it survives Next.js HMR and is shared
// across route handlers in a single server instance. Shaped so it could later
// be swapped for a Postgres-backed repository without touching call sites.

import type { Conversation, Message } from "./types";
import { seedConversations } from "./seed";

interface RelayStore {
  conversations: Conversation[];
  // monotonically increasing counter used to drive the inbound simulator
  inboundCursor: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __RELAY_STORE__: RelayStore | undefined;
}

function createStore(): RelayStore {
  return {
    conversations: seedConversations(),
    inboundCursor: 0,
  };
}

function db(): RelayStore {
  if (!globalThis.__RELAY_STORE__) {
    globalThis.__RELAY_STORE__ = createStore();
  }
  return globalThis.__RELAY_STORE__;
}

export function listConversations(): Conversation[] {
  // newest activity first
  return [...db().conversations].sort((a, b) => {
    const at = a.messages[a.messages.length - 1]?.createdAt ?? "";
    const bt = b.messages[b.messages.length - 1]?.createdAt ?? "";
    return bt.localeCompare(at);
  });
}

export function getConversation(id: string): Conversation | undefined {
  return db().conversations.find((c) => c.id === id);
}

export function getConversationByNumber(number: string): Conversation | undefined {
  return db().conversations.find((c) => c.contactNumber === number);
}

export function appendMessage(
  conversationId: string,
  message: Message,
): Message | undefined {
  const conv = getConversation(conversationId);
  if (!conv) return undefined;
  conv.messages.push(message);
  if (message.direction === "inbound") {
    conv.unread += 1;
  }
  return message;
}

export function updateMessageStatus(
  messageId: string,
  status: Message["status"],
): Message | undefined {
  for (const conv of db().conversations) {
    const msg = conv.messages.find((m) => m.id === messageId);
    if (msg) {
      msg.status = status;
      return msg;
    }
  }
  return undefined;
}

export function updateMessageStatusBySid(
  providerSid: string,
  status: Message["status"],
): Message | undefined {
  for (const conv of db().conversations) {
    const msg = conv.messages.find((m) => m.providerSid === providerSid);
    if (msg) {
      msg.status = status;
      return msg;
    }
  }
  return undefined;
}

export function markRead(conversationId: string): void {
  const conv = getConversation(conversationId);
  if (conv) conv.unread = 0;
}

// Deterministic inbound generator used by the simulator + test hook.
// Cycles through a small bank of realistic replies so a test can trigger
// exactly one and assert on it.
const INBOUND_BANK = [
  "Sounds good — what time works for you?",
  "Can you send over the invoice again?",
  "Perfect, I'll be there. Thanks!",
  "Actually, can we reschedule to tomorrow?",
  "Got it. Appreciate the quick reply!",
];

export function nextSimulatedInbound(conversationId?: string): Message | undefined {
  const store = db();
  const targets = conversationId
    ? store.conversations.filter((c) => c.id === conversationId)
    : store.conversations;
  if (targets.length === 0) return undefined;
  const conv = targets[store.inboundCursor % targets.length];
  const body = INBOUND_BANK[store.inboundCursor % INBOUND_BANK.length];
  store.inboundCursor += 1;

  const msg: Message = {
    id: `sim_${Date.now()}_${store.inboundCursor}`,
    conversationId: conv.id,
    channel: conv.channel,
    direction: "inbound",
    body,
    status: "received",
    createdAt: new Date().toISOString(),
  };
  appendMessage(conv.id, msg);
  return msg;
}

// Test-only: reset to a clean seed so suites don't leak state into each other.
export function resetStore(): void {
  globalThis.__RELAY_STORE__ = createStore();
}
