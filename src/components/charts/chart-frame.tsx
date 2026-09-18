"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared chart chrome: a legend for two or more series, and a visually hidden
 * table carrying the same numbers.
 *
 * The table is not a nicety — a chart that only exists as SVG geometry is
 * unreadable to a screen reader, and every value plotted here is also a value
 * somebody may need to read exactly.
 */
export interface ChartSeries {
  key: string;
  label: string;
  /** CSS colour, always a --viz-* token rather than a literal. */
  color: string;
}

export function ChartLegend({
  series,
  className,
}: {
  series: ChartSeries[];
  className?: string;
}) {
  // A single series needs no legend — the section title already names it.
  if (series.length < 2) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {series.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-0.5 w-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function ChartDataTable({
  caption,
  columnLabel,
  columns,
  rows,
}: {
  caption: string;
  columnLabel: string;
  columns: string[];
  rows: { label: string; values: (string | number)[] }[];
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{columnLabel}</th>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row">{row.label}</th>
            {row.values.map((value, index) => (
              <td key={index}>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
