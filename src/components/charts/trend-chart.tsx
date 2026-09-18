"use client";

import * as React from "react";
import { ChartLegend, ChartDataTable, type ChartSeries } from "./chart-frame";
import { cn } from "@/lib/utils";

export interface TrendPoint {
  label: string;
  values: Record<string, number>;
}

/**
 * Small multi-series line chart with a crosshair tooltip.
 *
 * Deliberately plain: one y-axis (never two — two scales on one plot invent a
 * correlation that is not in the data), 2px lines, a light area wash under a
 * single series, hairline gridlines, and end-markers big enough to hit. The
 * numbers are also emitted as a hidden table so the chart is not the only way
 * to read them.
 */
export function TrendChart({
  points,
  series,
  height = 168,
  valueSuffix = "",
  caption,
  className,
}: {
  points: TrendPoint[];
  series: ChartSeries[];
  height?: number;
  valueSuffix?: string;
  caption: string;
  className?: string;
}) {
  const [active, setActive] = React.useState<number | null>(null);
  const width = 560;
  const padding = { top: 12, right: 12, bottom: 24, left: 28 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const max = Math.max(
    1,
    ...points.flatMap((point) => series.map((item) => point.values[item.key] ?? 0)),
  );
  // Round the top of the scale to something a reader can hold in their head.
  const niceMax = max <= 5 ? max : Math.ceil(max / 5) * 5;

  const x = (index: number) =>
    padding.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const y = (value: number) => padding.top + plotHeight - (value / niceMax) * plotHeight;

  const ticks = [0, niceMax / 2, niceMax];

  function pathFor(seriesKey: string): string {
    return points
      .map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.values[seriesKey] ?? 0)}`)
      .join(" ");
  }

  function areaFor(seriesKey: string): string {
    const line = pathFor(seriesKey);
    return `${line} L${x(points.length - 1)},${padding.top + plotHeight} L${x(0)},${
      padding.top + plotHeight
    } Z`;
  }

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const position = ratio * width;
    let nearest = 0;
    let best = Infinity;
    points.forEach((_, index) => {
      const distance = Math.abs(x(index) - position);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    });
    setActive(nearest);
  }

  const activePoint = active === null ? null : points[active];

  return (
    <div className={cn("relative", className)}>
      <ChartLegend series={series} className="mb-3" />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full touch-none"
        style={{ height }}
        role="img"
        aria-label={caption}
        onPointerMove={handleMove}
        onPointerLeave={() => setActive(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--color-viz-grid)"
              strokeWidth={1}
            />
            <text
              x={padding.left - 6}
              y={y(tick) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[9px] tabular-nums"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        {series.length === 1 ? (
          <path d={areaFor(series[0].key)} fill={series[0].color} opacity={0.1} />
        ) : null}

        {series.map((item) => (
          <path
            key={item.key}
            d={pathFor(item.key)}
            fill="none"
            stroke={item.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {activePoint ? (
          <line
            x1={x(active as number)}
            x2={x(active as number)}
            y1={padding.top}
            y2={padding.top + plotHeight}
            stroke="var(--color-viz-grid)"
            strokeWidth={1}
          />
        ) : null}

        {/* End markers carry a surface ring so they stay legible where lines cross. */}
        {series.map((item) => {
          const index = active ?? points.length - 1;
          return (
            <circle
              key={item.key}
              cx={x(index)}
              cy={y(points[index]?.values[item.key] ?? 0)}
              r={4}
              fill={item.color}
              stroke="var(--color-card)"
              strokeWidth={2}
            />
          );
        })}

        {points.map((point, index) =>
          index % Math.max(1, Math.ceil(points.length / 6)) === 0 ? (
            <text
              key={point.label}
              x={x(index)}
              y={height - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {point.label}
            </text>
          ) : null,
        )}
      </svg>

      {activePoint ? (
        <div
          role="status"
          aria-live="off"
          className="pointer-events-none absolute top-0 right-0 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md"
        >
          <p className="font-medium text-foreground">{activePoint.label}</p>
          {series.map((item) => (
            <p key={item.key} className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
              <span
                aria-hidden="true"
                className="h-0.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
              <span className="ml-auto pl-2 font-medium tabular-nums text-foreground">
                {activePoint.values[item.key] ?? 0}
                {valueSuffix}
              </span>
            </p>
          ))}
        </div>
      ) : null}

      <ChartDataTable
        caption={caption}
        columnLabel="Period"
        columns={series.map((item) => item.label)}
        rows={points.map((point) => ({
          label: point.label,
          values: series.map((item) => point.values[item.key] ?? 0),
        }))}
      />
    </div>
  );
}
