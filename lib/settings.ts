// Per-visitor settings (Twilio creds + AI BYOK) persisted in an HttpOnly,
// server-only cookie. The payload is encrypted with AES-256-GCM so the raw
// secrets are never exposed to client JS or stored in plaintext.
//
// The encryption key is derived from a fixed app salt. This is intentionally a
// self-contained demo: secrets live only in the visitor's own browser cookie,
// are never sent to the deployer's logs, and the deployer's own env keys are
// never read for AI calls (so the live demo can never bill the owner).

import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import type { Settings } from "./types";

const COOKIE_NAME = "relay_settings";
const ALGO = "aes-256-gcm";

// Derive a stable 32-byte key. In a real multi-tenant product this would come
// from a managed secret; for a zero-config demo a fixed salt is sufficient
// because the ciphertext only ever round-trips through the same process.
const KEY = crypto
  .createHash("sha256")
  .update(process.env.RELAY_COOKIE_SECRET ?? "relay-cpaas-console-demo-salt-v1")
  .digest();

export const DEFAULT_SETTINGS: Settings = { mode: "simulator" };

export function encryptSettings(settings: Settings): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const plaintext = Buffer.from(JSON.stringify(settings), "utf8");
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv.tag.ciphertext, all base64url
  return [iv, tag, enc].map((b) => b.toString("base64url")).join(".");
}

export function decryptSettings(token: string | undefined): Settings {
  if (!token) return DEFAULT_SETTINGS;
  try {
    const [ivB, tagB, encB] = token.split(".");
    if (!ivB || !tagB || !encB) return DEFAULT_SETTINGS;
    const iv = Buffer.from(ivB, "base64url");
    const tag = Buffer.from(tagB, "base64url");
    const enc = Buffer.from(encB, "base64url");
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    const parsed = JSON.parse(dec.toString("utf8")) as Settings;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Read settings server-side for the current request.
export async function readSettings(): Promise<Settings> {
  const store = await cookies();
  return decryptSettings(store.get(COOKIE_NAME)?.value);
}

export async function writeSettings(settings: Settings): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, encryptSettings(settings), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

// A redacted, client-safe view of settings — never leaks raw secrets to the UI.
export interface PublicSettings {
  mode: Settings["mode"];
  twilioConfigured: boolean;
  twilioFrom?: string;
  aiProvider?: Settings["aiProvider"];
  aiModel?: string;
  aiConfigured: boolean;
}

export function toPublic(s: Settings): PublicSettings {
  return {
    mode: s.mode,
    twilioConfigured: Boolean(s.twilioAccountSid && s.twilioAuthToken),
    twilioFrom: s.twilioFrom,
    aiProvider: s.aiProvider,
    aiModel: s.aiModel,
    aiConfigured: s.aiProvider === "mock" || Boolean(s.aiProvider && s.aiKey),
  };
}

export { COOKIE_NAME };
