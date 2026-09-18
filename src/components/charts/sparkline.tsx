"use client";

import { cn } from "@/lib/utils";

/**
 * A bare trend shape for a stat tile — no axes, no labels, no tooltip. It says
 * "rising" or "falling" and nothing more precise; the tile's own number and
 * comparison carry the precision, and the full chart carries the detail.
 */
export function Sparkline({
  values,
  className,
  ariaLabel,
}: {
  values: number[];
  className?: string;
  ariaLabel: string;
}) {
  if (values.length < 2) return null;

  const width = 96;
  const height = 24;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const x = (index: number) => (index / (values.length - 1)) * width;
  const y = (value: number) => height - 2 - ((value - min) / span) * (height - 4);

  const line = values.map((value, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(value)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-6 w-24 overflow-visible", className)}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      <path d={area} fill="var(--color-viz-1)" opacity={0.1} />
      <path
        d={line}
        fill="none"
        stroke="var(--color-viz-1)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={x(values.length - 1)}
        cy={y(values[values.length - 1])}
        r={2.5}
        fill="var(--color-viz-1)"
        stroke="var(--color-card)"
        strokeWidth={1.5}
      />
    </svg>
  );
}
