"use client";

import type { Message } from "@/lib/types";
import { StatusPill } from "./StatusPill";
import { formatDuration, relativeTime } from "@/lib/ui";

export function MessageItem({ message }: { message: Message }) {
  const outbound = message.direction === "outbound";
  return (
    <div
      className={`flex animate-in ${outbound ? "justify-end" : "justify-start"}`}
      data-testid="message"
      data-direction={message.direction}
    >
      <div className={`max-w-[78%] ${outbound ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {message.voice ? (
          <VoiceCard message={message} outbound={outbound} />
        ) : message.rcs ? (
          <RcsCardView message={message} outbound={outbound} />
        ) : (
          <Bubble outbound={outbound}>{message.body}</Bubble>
        )}
        <div className={`flex items-center gap-2 px-1 ${outbound ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-[#6b7280]">{relativeTime(message.createdAt)}</span>
          {outbound && <StatusPill status={message.status} />}
        </div>
      </div>
    </div>
  );
}

function Bubble({
  children,
  outbound,
}: {
  children: React.ReactNode;
  outbound: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
        outbound
          ? "rounded-br-md bg-[#2563eb] text-white"
          : "rounded-bl-md bg-[#1a1d27] text-[#dfe3ec] ring-1 ring-[#262a36]"
      }`}
    >
      {children}
    </div>
  );
}

function VoiceCard({ message, outbound }: { message: Message; outbound: boolean }) {
  const v = message.voice!;
  return (
    <div
      className={`w-[300px] max-w-full rounded-2xl p-3 ring-1 ${
        outbound ? "bg-[#19213a] ring-[#2a3a66]" : "bg-[#1a1d27] ring-[#262a36]"
      }`}
      data-testid="voice-card"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-channel-voice/20 text-channel-voice">
          <PhoneIcon />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-[#e6e8ee]">
            {outbound ? "Outbound call" : "Inbound call"}
          </div>
          <div className="text-[10px] text-[#8b93a3]">{formatDuration(v.durationSec)}</div>
        </div>
      </div>
      <div className="mt-2 rounded-lg bg-black/20 p-2 text-xs leading-relaxed text-[#b6bccb]">
        <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#6b7280]">
          Transcript
        </div>
        {v.transcript}
      </div>
    </div>
  );
}

function RcsCardView({ message, outbound }: { message: Message; outbound: boolean }) {
  const c = message.rcs!;
  return (
    <div
      className={`w-[300px] max-w-full overflow-hidden rounded-2xl ring-1 ${
        outbound ? "ring-[#2a3a66]" : "ring-[#262a36]"
      } bg-[#11141c]`}
      data-testid="rcs-card"
    >
      <div className="h-16 w-full" style={{ background: `linear-gradient(135deg, ${c.imageColor ?? "#10b981"}33, ${c.imageColor ?? "#10b981"}0a)` }} />
      <div className="p-3">
        <div className="text-sm font-semibold text-[#e6e8ee]">{c.title}</div>
        {c.description && (
          <div className="mt-0.5 text-xs text-[#9aa3b2]">{c.description}</div>
        )}
        {message.body && c.title !== message.body && (
          <div className="mt-1.5 text-xs text-[#b6bccb]">{message.body}</div>
        )}
        {c.quickReplies && c.quickReplies.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {c.quickReplies.map((q, i) => (
              <span
                key={i}
                className="rounded-full bg-channel-rcs/10 px-2.5 py-1 text-[11px] font-medium text-channel-rcs ring-1 ring-channel-rcs/30"
                data-testid="quick-reply"
              >
                {q.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
