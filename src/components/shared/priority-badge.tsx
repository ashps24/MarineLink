import { cn } from "@/lib/utils";
import { servicePriorityConfig } from "@/lib/constants/status";
import type { ServiceRequestPriority } from "@/types";
import { ToneBadge } from "./status-badge";

export function PriorityBadge({
  priority,
  className,
}: {
  priority: ServiceRequestPriority;
  className?: string;
}) {
  const config = servicePriorityConfig[priority];
  return (
    <ToneBadge
      label={config.label}
      tone={config.tone}
      className={cn("uppercase tracking-wide", className)}
    />
  );
}
