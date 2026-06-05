import { CHANNEL_META } from "@/lib/ui";
import type { Channel } from "@/lib/types";

export function ChannelBadge({ channel }: { channel: Channel }) {
  const m = CHANNEL_META[channel];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: m.color, background: m.bg, boxShadow: `inset 0 0 0 1px ${m.ring}` }}
      data-testid={`channel-badge-${channel}`}
    >
      {m.label}
    </span>
  );
}
