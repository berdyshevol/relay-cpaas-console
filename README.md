# Relay — AI-first CPaaS messaging console

## Live demo

https://relay-cpaas-console.vercel.app


A unified communications console for **SMS, Voice, and RCS** with a built-in
**AI agent**, a **real Twilio integration**, and a **safe simulator mode** that
makes the whole thing run with **zero configuration**. Built with Next.js 15
(App Router), TypeScript, and Tailwind.

This is a portfolio piece demonstrating telecom / CPaaS / messaging engineering:
multi-channel conversation modeling, Twilio webhook signature verification,
delivery-status lifecycles, an LLM agent over conversation context, and a
careful BYOK security posture.

---

## What it demonstrates

### 1. Unified multi-channel console
A single inbox across three channels, each with channel-appropriate rendering:

- **SMS** — classic inbound/outbound bubbles with delivery-status pills
  (`queued → sent → delivered`).
- **Voice** — call cards showing direction, duration, and a transcript.
- **RCS** — rich cards with an image header, title/description, and
  quick-reply chips.

Left rail lists conversations (contact, channel badge, last-message preview,
timestamp, unread count). Center shows the thread + composer. Right rail is the
AI agent. Top bar has channel filters, search, an inbound trigger, and Settings.

### 2. Real Twilio integration, safe by default
The Twilio code is real — it just defaults to a simulator so the live demo needs
no credentials and can never send real traffic or bill anyone.

- **`lib/twilio.ts` — `sendMessage()`**
  - `MODE=live`: sends via the official `twilio` REST client using BYOK creds.
  - `MODE=simulator` (default): records an outbound message and simulates the
    delivery-status progression `queued → sent → delivered`.
- **`app/api/twilio/inbound/route.ts`** — inbound webhook that verifies the
  `X-Twilio-Signature` header with `twilio.validateRequest(...)` **before**
  processing. Missing/invalid signature ⇒ **403**. The URL is reconstructed
  from forwarded headers so verification holds behind a proxy/tunnel.
- **`app/api/twilio/status/route.ts`** — status-callback handler that updates a
  message's delivery status by its provider SID (same signature contract).

Signature verification is exercised end-to-end even without live credentials: in
simulator mode the webhook is validated against a public, non-secret simulator
token, so the "reject unsigned requests" contract is demonstrable and tested.

### 3. AI agent (BYOK, structured output)
The right rail runs an agent over the active thread's full history:

- **Draft reply**, **Auto-reply**, **Summarize**, **Detect intent**.
- Built on the **Vercel AI SDK** (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`).
  `lib/llm.ts` builds the model from the visitor's saved provider + key + model
  and returns **zod-validated structured JSON**:
  `{ suggestedReply, summary, intent, nextAction }`.
- **BYOK**: the visitor pastes their *own* OpenAI/Anthropic key in Settings. It
  is stored in an **AES-256-GCM-encrypted, HttpOnly cookie** and read
  server-side per request. The deployer's env keys are never used — the hosted
  demo can never bill the owner.
- **Gating**: with no key, AI buttons are disabled and show an inline
  "Add your OpenAI/Anthropic key in Settings to enable AI" hint. Browsing,
  composing, and the simulator all work with no key.
- **Mock mode**: a `provider: "mock"` sentinel returns deterministic, thread-
  aware output **without calling any provider** — used for deterministic tests
  and for previewing the agent UX with no key.

### 4. Simulator
An in-memory store on `globalThis` (HMR-safe, no DB) seeds ~6 realistic
conversations spanning all three channels with multi-message threads. A
"Live feed" toggle generates new inbound messages on an interval, and a
"+ Inbound" button / `POST /api/simulator` hook injects one deterministically
(used by the tests). The store is shaped as a repository so it could later be
swapped for Postgres without touching call sites.

---

## Architecture

```
app/
  page.tsx                       server component → seeds initial props
  api/
    conversations/route.ts       GET conversations
    messages/route.ts            POST send / PATCH mark-read
    simulator/route.ts           POST deterministic inbound (test hook)
    agent/route.ts               POST AI agent (zod-validated, BYOK-gated)
    settings/route.ts            GET/POST BYOK settings (encrypted cookie)
    twilio/inbound/route.ts      signed inbound webhook (403 on bad sig)
    twilio/status/route.ts       signed status callback
lib/
  types.ts        domain model (Channel, Message, Conversation, Settings)
  store.ts        globalThis in-memory repository
  seed.ts         deterministic seed data (SMS / Voice / RCS)
  twilio.ts       sendMessage() (live REST vs simulator)
  twilio-sign.ts  signature verify + sign helpers (shared with tests)
  llm.ts          Vercel AI SDK model selection + agent (+ mock sentinel)
  settings.ts     AES-256-GCM encrypted HttpOnly cookie settings
  ui.ts           channel metadata + formatting helpers
components/        Console, MessageItem, SettingsModal, badges, etc.
tests/            Playwright specs (01–05)
```

### Security posture
- Secrets (Twilio creds, LLM keys) live only in the visitor's **HttpOnly,
  encrypted** cookie; a redacted `PublicSettings` view is all the client ever
  sees.
- Twilio webhooks are **signature-verified before any side effect**.
- No deployer env key is read for billing-incurring calls.

---

## Run locally

Requirements: Node 18+ and `pnpm`.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Production build / start:

```bash
pnpm build
pnpm start
```

### Try the AI agent without a key
Open **Settings → AI agent → "Use deterministic mock agent"**, then use the
right-rail buttons. To use a real model, pick OpenAI or Anthropic and paste your
own key.

### Try live Twilio (optional)
Settings → set **Delivery mode = live** and paste your Twilio Account SID, Auth
Token, and From number. Point a Twilio number's inbound webhook at
`/api/twilio/inbound` and its status callback at `/api/twilio/status`.

---

## Tests

Playwright (Chromium) covers the core contracts:

```bash
pnpm exec playwright test
```

1. Conversations list renders multiple channels; clicking shows messages.
2. Composer send adds an outbound message with a delivery status.
3. Inbound simulator delivers a new inbound message into a thread.
4. BYOK gate: disabled + hint with no key; mock provider returns deterministic
   reply + summary + intent.
5. Twilio inbound webhook returns **403** for missing/invalid signature (and
   **200** for a correctly signed request).

Result summary is written to `.test-summary.json`.

---

## Notes
- No external service is required at deploy or runtime; the app runs with **zero
  env vars**. `RELAY_COOKIE_SECRET` is an optional override for the cookie key.
- `next` is pinned to a patched `15.5.19`.
