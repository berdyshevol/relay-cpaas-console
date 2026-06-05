import { NextRequest, NextResponse } from "next/server";
import { nextSimulatedInbound } from "@/lib/store";

export const dynamic = "force-dynamic";

// Deterministic inbound generator used by the demo's background simulator and
// by Playwright (an explicit "trigger inbound" hook). Optionally targets one
// conversation via ?conversationId=.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const conversationId =
    body?.conversationId ?? req.nextUrl.searchParams.get("conversationId") ?? undefined;
  const msg = nextSimulatedInbound(conversationId);
  if (!msg) {
    return NextResponse.json({ error: "no_conversations" }, { status: 404 });
  }
  return NextResponse.json({ message: msg });
}
