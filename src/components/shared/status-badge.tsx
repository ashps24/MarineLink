import { cn } from "@/lib/utils";
import type { SemanticTone } from "@/lib/constants/status";
import {
  customerStatusConfig,
  dealerStatusConfig,
  equipmentStatusConfig,
  serviceStatusConfig,
} from "@/lib/constants/status";
import type {
  CustomerStatus,
  DealerStatus,
  EquipmentStatus,
  ServiceRequestStatus,
} from "@/types";

/**
 * One tone scale for every status in the product, so a colour always means the
 * same thing. Tones resolve to semantic tokens rather than raw palette values.
 */
export const toneClasses: Record<SemanticTone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  info: "bg-info/10 text-info ring-info/25 dark:bg-info/15",
  success: "bg-success/10 text-success ring-success/25 dark:bg-success/15",
  warning: "bg-warning/15 text-warning-foreground ring-warning/35 dark:bg-warning/20 dark:text-warning",
  danger: "bg-destructive/10 text-destructive ring-destructive/25 dark:bg-destructive/15",
};

/**
 * Opaque treatment for badges sitting on top of a photograph. The tinted
 * backgrounds above are mixed against a card surface; over an image they lose
 * contrast, so these swap the tint for the card colour and keep the tone in the
 * text and ring.
 */
export const onMediaToneClasses: Record<SemanticTone, string> = {
  neutral: "bg-card text-muted-foreground ring-border shadow-sm",
  info: "bg-card text-info ring-info/30 shadow-sm",
  success: "bg-card text-success ring-success/30 shadow-sm",
  warning: "bg-card text-warning-foreground ring-warning/40 shadow-sm dark:text-warning",
  danger: "bg-card text-destructive ring-destructive/30 shadow-sm",
};

const dotClasses: Record<SemanticTone, string> = {
  neutral: "bg-muted-foreground/60",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

interface StatusBadgeBaseProps {
  label: string;
  tone: SemanticTone;
  className?: string;
  /** Status is never carried by colour alone — the dot is decorative only. */
  showDot?: boolean;
  /** Use the opaque treatment, for badges placed over photography. */
  onMedia?: boolean;
}

export function ToneBadge({
  label,
  tone,
  className,
  showDot = true,
  onMedia = false,
}: StatusBadgeBaseProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        onMedia ? onMediaToneClasses[tone] : toneClasses[tone],
        className,
      )}
    >
      {showDot ? (
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", dotClasses[tone])} />
      ) : null}
      {label}
    </span>
  );
}

export function StatusBadge({
  kind,
  status,
  className,
  onMedia,
}:
  | { kind: "dealer"; status: DealerStatus; className?: string; onMedia?: boolean }
  | { kind: "customer"; status: CustomerStatus; className?: string; onMedia?: boolean }
  | { kind: "equipment"; status: EquipmentStatus; className?: string; onMedia?: boolean }
  | { kind: "service"; status: ServiceRequestStatus; className?: string; onMedia?: boolean }) {
  const config =
    kind === "dealer"
      ? dealerStatusConfig[status]
      : kind === "customer"
        ? customerStatusConfig[status]
        : kind === "equipment"
          ? equipmentStatusConfig[status]
          : serviceStatusConfig[status];

  return (
    <ToneBadge
      label={config.label}
      tone={config.tone}
      className={className}
      onMedia={onMedia}
    />
  );
}
