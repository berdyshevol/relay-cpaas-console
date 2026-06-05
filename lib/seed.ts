import type { Conversation, Message } from "./types";

// Fixed reference time so the seed is deterministic regardless of when the
// server boots (relative timestamps are computed from this anchor).
const ANCHOR = new Date("2026-06-04T15:00:00.000Z").getTime();

function ago(minutes: number): string {
  return new Date(ANCHOR - minutes * 60_000).toISOString();
}

let seq = 0;
function mid(): string {
  seq += 1;
  return `seed_${seq}`;
}

export function seedConversations(): Conversation[] {
  seq = 0;
  return [
    {
      id: "conv_acme",
      channel: "sms",
      contactName: "Maya Chen",
      contactNumber: "+14155550112",
      unread: 2,
      messages: msgs("conv_acme", "sms", [
        ["inbound", "Hi! I saw your text about the demo slot — is Thursday still open?", 240],
        ["outbound", "Hey Maya! Yes, Thursday 2pm PT works great. Want me to lock it in?", 232],
        ["inbound", "Yes please. Also can you send pricing for the Pro tier?", 30],
        ["inbound", "And does Pro include the voice add-on?", 12],
      ]),
    },
    {
      id: "conv_delta",
      channel: "voice",
      contactName: "Devon Brooks",
      contactNumber: "+13105550148",
      unread: 0,
      messages: [
        {
          id: mid(),
          conversationId: "conv_delta",
          channel: "voice",
          direction: "inbound",
          body: "Inbound call — 2m 14s",
          status: "received",
          createdAt: ago(180),
          voice: {
            durationSec: 134,
            transcript:
              "Hi, this is Devon. I'm calling about the porting request for our 800 number. We need it moved before the 15th — can someone confirm the timeline and what paperwork you need from us?",
          },
        },
        {
          id: mid(),
          conversationId: "conv_delta",
          channel: "voice",
          direction: "outbound",
          body: "Outbound call — 0m 48s",
          status: "delivered",
          createdAt: ago(120),
          voice: {
            durationSec: 48,
            transcript:
              "Hi Devon, returning your call about the port. The 15th is doable — I'll email the LOA and a copy of your latest carrier bill request. Expect it within the hour.",
          },
        },
      ],
    },
    {
      id: "conv_orbit",
      channel: "rcs",
      contactName: "Orbit Logistics",
      contactNumber: "+18005550190",
      unread: 1,
      messages: [
        {
          id: mid(),
          conversationId: "conv_orbit",
          channel: "rcs",
          direction: "outbound",
          body: "Your shipment ORB-4471 is out for delivery.",
          status: "read",
          createdAt: ago(95),
          rcs: {
            title: "Shipment ORB-4471",
            description: "Out for delivery • ETA 4:30 PM",
            imageColor: "#10b981",
            quickReplies: [
              { label: "Track", payload: "TRACK" },
              { label: "Reschedule", payload: "RESCHEDULE" },
              { label: "Leave at door", payload: "DOOR" },
            ],
          },
        },
        {
          id: mid(),
          conversationId: "conv_orbit",
          channel: "rcs",
          direction: "inbound",
          body: "Reschedule",
          status: "received",
          createdAt: ago(20),
        },
      ],
    },
    {
      id: "conv_finch",
      channel: "sms",
      contactName: "Priya Nair",
      contactNumber: "+16175550133",
      unread: 0,
      messages: msgs("conv_finch", "sms", [
        ["outbound", "Your one-time verification code is 884213. It expires in 10 minutes.", 600],
        ["inbound", "Thanks, got it. All set now.", 590],
      ]),
    },
    {
      id: "conv_nova",
      channel: "rcs",
      contactName: "Nova Bank Support",
      contactNumber: "+18885550177",
      unread: 0,
      messages: [
        {
          id: mid(),
          conversationId: "conv_nova",
          channel: "rcs",
          direction: "inbound",
          body: "I think there's a duplicate charge on my card from yesterday.",
          status: "received",
          createdAt: ago(50),
        },
        {
          id: mid(),
          conversationId: "conv_nova",
          channel: "rcs",
          direction: "outbound",
          body: "We can help with that. Which transaction looks duplicated?",
          status: "delivered",
          createdAt: ago(44),
          rcs: {
            title: "Recent transactions",
            description: "Tap the one that looks wrong",
            imageColor: "#3b82f6",
            quickReplies: [
              { label: "$42.10 Coffee", payload: "TX1" },
              { label: "$42.10 Coffee", payload: "TX2" },
              { label: "Something else", payload: "OTHER" },
            ],
          },
        },
      ],
    },
    {
      id: "conv_atlas",
      channel: "voice",
      contactName: "Atlas Field Team",
      contactNumber: "+14085550160",
      unread: 0,
      messages: [
        {
          id: mid(),
          conversationId: "conv_atlas",
          channel: "voice",
          direction: "inbound",
          body: "Inbound call — 1m 02s",
          status: "received",
          createdAt: ago(310),
          voice: {
            durationSec: 62,
            transcript:
              "Hey, the tech onsite says the SIP trunk dropped twice this morning during peak hours. Can you check if it's on our side or the carrier's? Call me back when you can.",
          },
        },
      ],
    },
  ];
}

type Tuple = ["inbound" | "outbound", string, number];

function msgs(
  conversationId: string,
  channel: "sms" | "voice" | "rcs",
  rows: Tuple[],
): Message[] {
  return rows.map(([direction, body, minutesAgo]) => ({
    id: mid(),
    conversationId,
    channel,
    direction,
    body,
    status: direction === "outbound" ? "delivered" : "received",
    createdAt: ago(minutesAgo),
  }));
}
