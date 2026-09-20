"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Band {
  key: string;
  label: string;
  count: number;
  tone: "info" | "success" | "warning" | "danger" | "neutral";
  href?: string;
}

const FILL: Record<Band["tone"], string> = {
  neutral: "bg-muted-foreground/40",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

/**
 * A count split across a few named states, as one proportional bar plus the
 * figures. Each segment is separated by the surface colour so adjacent fills
 * never read as one block.
 */
export function BandPanel({ bands, emptyLabel }: { bands: Band[]; emptyLabel: string }) {
  const total = bands.reduce((sum, band) => sum + band.count, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {bands
          .filter((band) => band.count > 0)
          .map((band) => (
            <span
              key={band.key}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", FILL[band.tone])}
              style={{ width: `${(band.count / total) * 100}%` }}
            />
          ))}
      </div>

      <ul className="space-y-1.5">
        {bands.map((band) => {
          const row = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn("size-1.5 shrink-0 rounded-full", FILL[band.tone])}
                />
                <span className="truncate text-sm text-muted-foreground">{band.label}</span>
              </span>
              <span className="shrink-0 text-sm font-medium tabular-nums">{band.count}</span>
            </>
          );

          return (
            <li key={band.key}>
              {band.href && band.count > 0 ? (
                <Link
                  prefetch={false}
                  href={band.href}
                  className="flex items-center justify-between gap-3 rounded-md px-1 py-0.5 transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {row}
                </Link>
              ) : (
                <span className="flex items-center justify-between gap-3 px-1 py-0.5">{row}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
