import { statusLabel } from "@/lib/ui";
import type { DeliveryStatus } from "@/lib/types";

const COLOR: Record<DeliveryStatus, string> = {
  queued: "#9aa3b2",
  sent: "#9aa3b2",
  delivered: "#34d399",
  read: "#60a5fa",
  failed: "#f87171",
  received: "#9aa3b2",
};

export function StatusPill({ status }: { status: DeliveryStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium"
      style={{ color: COLOR[status] }}
      data-testid="status-pill"
      data-status={status}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: COLOR[status] }}
      />
      {statusLabel(status)}
    </span>
  );
}
