"use client";

import { cn } from "@/lib/utils";

/**
 * A single ratio against its whole — the honest form for "how much of the fleet
 * is available", where a two-slice pie would be worse and a bar chart of one bar
 * would be silly. The track is the same hue as the fill, one step back.
 */
export function Meter({
  value,
  total,
  label,
  valueLabel,
  tone = "default",
  className,
}: {
  value: number;
  total: number;
  label: string;
  valueLabel?: string;
  tone?: "default" | "warning" | "danger";
  className?: string;
}) {
  const safeTotal = Math.max(1, total);
  const percent = Math.round((value / safeTotal) * 100);

  const fillClass =
    tone === "danger"
      ? "bg-destructive"
      : tone === "warning"
        ? "bg-warning"
        : "bg-[var(--color-viz-1)]";

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-viz-track)]"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-label={label}
        aria-valuetext={valueLabel ?? `${value} of ${total} (${percent}%)`}
      >
        <span
          aria-hidden="true"
          className={cn("block h-full rounded-full transition-[width] duration-700", fillClass)}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{valueLabel ?? `${value} of ${total}`}</p>
    </div>
  );
}
