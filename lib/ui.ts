import type { Channel, DeliveryStatus } from "./types";

export const CHANNEL_META: Record<
  Channel,
  { label: string; color: string; bg: string; ring: string }
> = {
  sms: {
    label: "SMS",
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.12)",
    ring: "rgba(59,130,246,0.4)",
  },
  voice: {
    label: "Voice",
    color: "#c084fc",
    bg: "rgba(168,85,247,0.12)",
    ring: "rgba(168,85,247,0.4)",
  },
  rcs: {
    label: "RCS",
    color: "#34d399",
    bg: "rgba(16,185,129,0.12)",
    ring: "rgba(16,185,129,0.4)",
  },
};

export function statusLabel(s: DeliveryStatus): string {
  switch (s) {
    case "queued":
      return "Queued";
    case "sent":
      return "Sent";
    case "delivered":
      return "Delivered";
    case "read":
      return "Read";
    case "failed":
      return "Failed";
    case "received":
      return "Received";
  }
}

export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
