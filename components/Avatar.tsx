import { CHANNEL_META, initials } from "@/lib/ui";
import type { Channel } from "@/lib/types";

export function Avatar({ name, channel }: { name: string; channel: Channel }) {
  const m = CHANNEL_META[channel];
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{ background: m.bg, color: m.color, boxShadow: `inset 0 0 0 1px ${m.ring}` }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
