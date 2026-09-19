"use client";

import * as React from "react";
import Link from "next/link";
import { ChartDataTable } from "./chart-frame";
import { cn } from "@/lib/utils";

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  /** Secondary figure shown after the value, e.g. "of 4 units". */
  detail?: string;
  href?: string;
}

/**
 * Horizontal bars for comparing magnitude across named things.
 *
 * One hue for every bar: length already encodes the magnitude, so colouring
 * darker-where-bigger would spend the only free channel restating it. Bars are
 * capped in thickness and the value is direct-labelled at the tip, which keeps
 * the axis out of it entirely.
 */
export function BarList({
  data,
  caption,
  valueLabel = "Value",
  emptyMessage = "No data to compare yet.",
  className,
}: {
  data: BarDatum[];
  caption: string;
  valueLabel?: string;
  emptyMessage?: string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((datum) => datum.value));

  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <ul className="space-y-2.5">
        {data.map((datum) => {
          const width = `${Math.max(2, (datum.value / max) * 100)}%`;

          const body = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-foreground">{datum.label}</span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {datum.value}
                  {datum.detail ? (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {datum.detail}
                    </span>
                  ) : null}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-viz-track)]">
                <span
                  aria-hidden="true"
                  className="block h-full rounded-full bg-[var(--color-viz-1)] transition-[width] duration-500"
                  style={{ width }}
                />
              </div>
            </>
          );

          return (
            <li key={datum.key}>
              {datum.href ? (
                <Link prefetch={false}
                  href={datum.href}
                  className="block rounded-lg px-1 py-1 transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {body}
                </Link>
              ) : (
                <div className="px-1 py-1">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <ChartDataTable
        caption={caption}
        columnLabel="Name"
        columns={[valueLabel]}
        rows={data.map((datum) => ({
          label: datum.label,
          values: [datum.detail ? `${datum.value} ${datum.detail}` : datum.value],
        }))}
      />
    </div>
  );
}
