// Signature helpers shared by the server route and tests. Intentionally free
// of "server-only" so it can be imported from the Playwright (Node) context.
import crypto from "crypto";
import twilio from "twilio";

// Public, non-secret token used to sign/verify simulator webhooks. This is NOT
// a real credential — it exists purely so the signature-verification path is
// exercisable in the zero-config demo and in tests.
export const SIMULATOR_TOKEN = "relay-simulator-token";

// Verify an inbound Twilio webhook signature. Returns true only when the
// X-Twilio-Signature header matches Twilio's HMAC over the full URL + params.
// When no live auth token is configured we verify against the simulator token,
// so the "reject missing/invalid signature with 403" contract holds in the
// zero-config demo without weakening the live path.
export function verifyTwilioSignature(args: {
  authToken?: string;
  signature: string | null;
  url: string;
  params: Record<string, string>;
}): boolean {
  const { authToken, signature, url, params } = args;
  if (!signature) return false;
  const token = authToken || SIMULATOR_TOKEN;
  return twilio.validateRequest(token, signature, url, params);
}

// Produce a valid signature for a simulated inbound webhook (mirrors how Twilio
// signs requests: HMAC-SHA1 over url + sorted key/value concatenation).
export function signSimulatorRequest(
  url: string,
  params: Record<string, string>,
): string {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  return crypto
    .createHmac("sha1", SIMULATOR_TOKEN)
    .update(Buffer.from(data, "utf-8"))
    .digest("base64");
}
