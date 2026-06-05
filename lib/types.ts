// Shared domain types for the Relay CPaaS console.
// Modeled to map cleanly onto a future relational schema (conversations, messages).

export type Channel = "sms" | "voice" | "rcs";

export type Direction = "inbound" | "outbound";

export type DeliveryStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "received";

export interface QuickReply {
  label: string;
  payload: string;
}

export interface RcsCard {
  title: string;
  description?: string;
  imageColor?: string; // tailwind-ish accent for the demo
  quickReplies?: QuickReply[];
}

export interface VoiceMeta {
  durationSec: number;
  transcript: string;
  recordingUrl?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  channel: Channel;
  direction: Direction;
  body: string;
  status: DeliveryStatus;
  createdAt: string; // ISO
  // channel-specific payloads
  rcs?: RcsCard;
  voice?: VoiceMeta;
  // provider linkage (Twilio SID etc.) — present in live mode
  providerSid?: string;
}

export interface Conversation {
  id: string;
  channel: Channel;
  contactName: string;
  contactNumber: string;
  unread: number;
  messages: Message[];
}

export interface AgentResult {
  suggestedReply: string;
  summary: string;
  intent: string;
  nextAction: string;
}

export type Mode = "simulator" | "live";

export type AiProvider = "openai" | "anthropic" | "mock";

export interface Settings {
  mode: Mode;
  // Twilio (live mode)
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFrom?: string;
  // AI BYOK
  aiProvider?: AiProvider;
  aiKey?: string;
  aiModel?: string;
}
