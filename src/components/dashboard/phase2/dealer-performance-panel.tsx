"use client";

import Link from "next/link";
import { TrendUp, TrendDown } from "@phosphor-icons/react/dist/ssr";
import { DetailSection } from "@/components/shared/detail-section";
import type { DealerPerformanceRow } from "@/lib/services";
import { cn } from "@/lib/utils";

/** A dealer needs at least one closure before an average means anything. */
const MIN_CLOSURES_TO_RANK = 1;
const SHOW_PER_SIDE = 3;

function Row({ row, tone }: { row: DealerPerformanceRow; tone: "good" | "bad" }) {
  return (
    <li>
      <Link
        prefetch={false}
        href={`/dealers/view/?id=${row.dealerId}`}
        className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{row.dealerName}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {row.resolvedCount} closed
            {row.averageResponseHours !== null
              ? ` · ${row.averageResponseHours.toFixed(1)}h to first action`
              : ""}
            {row.openCount > 0 ? ` · ${row.openCount} open` : ""}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 text-sm font-semibold tabular-nums",
            tone === "good" ? "text-success" : "text-destructive",
          )}
        >
          {(row.averageResolutionDays as number).toFixed(1)}d
        </span>
      </Link>
    </li>
  );
}

/**
 * Who closes work quickly and who does not, ranked on average days to
 * resolution. Every row carries the number of closures behind its average,
 * because early on that number is small enough to matter more than the rank.
 */
export function DealerPerformancePanel({ rows }: { rows: DealerPerformanceRow[] }) {
  const rankable = rows.filter(
    (row) => row.averageResolutionDays !== null && row.resolvedCount >= MIN_CLOSURES_TO_RANK,
  );
  const unranked = rows.filter((row) => !rankable.includes(row));

  if (rankable.length === 0) {
    return (
      <DetailSection title="Dealer performance" description="Ranked on time to resolution">
        <p className="text-sm text-muted-foreground">
          No dealer has closed a request yet, so there is nothing to rank on.
        </p>
      </DetailSection>
    );
  }

  const fastest = rankable.slice(0, SHOW_PER_SIDE);
  // With few dealers the two lists would otherwise repeat the same rows.
  const slowest = rankable
    .slice(-SHOW_PER_SIDE)
    .filter((row) => !fastest.includes(row))
    .reverse();

  return (
    <DetailSection
      title="Dealer performance"
      description="Average days to resolution, fastest first"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <TrendDown size={12} weight="bold" aria-hidden="true" className="text-success" />
            Quickest
          </p>
          <ul className="space-y-0.5">
            {fastest.map((row) => (
              <Row key={row.dealerId} row={row} tone="good" />
            ))}
          </ul>
        </div>

        {slowest.length > 0 ? (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <TrendUp size={12} weight="bold" aria-hidden="true" className="text-destructive" />
              Slowest
            </p>
            <ul className="space-y-0.5">
              {slowest.map((row) => (
                <Row key={row.dealerId} row={row} tone="bad" />
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {unranked.length > 0 ? (
        <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          {unranked.length} {unranked.length === 1 ? "dealer has" : "dealers have"} closed
          nothing yet and {unranked.length === 1 ? "is" : "are"} not ranked. Averages drawn from
          one or two closures move a lot — the count beside each dealer says how much to read
          into it.
        </p>
      ) : null}
    </DetailSection>
  );
}
