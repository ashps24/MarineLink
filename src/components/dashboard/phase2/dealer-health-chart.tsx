"use client";

import Link from "next/link";
import { DetailSection } from "@/components/shared/detail-section";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { usePhase2Dashboard } from "@/hooks/use-phase2-dashboard";
import { Buildings, MapPin } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const healthDot: Record<"good" | "watch" | "attention", string> = {
  good: "bg-success",
  watch: "bg-warning",
  attention: "bg-destructive",
};

const healthLabel: Record<"good" | "watch" | "attention", string> = {
  good: "On track",
  watch: "Watch",
  attention: "Needs attention",
};

/**
 * Dealer network health, ranked by open requests per 100 fielded units so a
 * small dealer's single request cannot outrank a large dealer's real problem.
 * Internal staff only — a dealer or customer view never sees other dealers.
 */
export function DealerHealthChart() {
  const { data, isPending, isError, refetch } = usePhase2Dashboard();

  return (
    <DetailSection
      title="Dealer network health"
      description="Ranked by open load relative to fleet size, not raw count"
      contentClassName="p-0"
    >
      {isPending ? (
        <ListSkeleton count={5} label="Loading dealer network health" className="p-4" />
      ) : isError || !data ? (
        <ErrorState
          className="m-4"
          title="Could not load dealer health"
          description="The dashboard service did not respond."
          onRetry={() => refetch()}
        />
      ) : data.dealerHealth.length === 0 ? (
        <EmptyState className="border-0" icon={Buildings} title="No dealers to rank" />
      ) : (
        <div className="divide-y divide-border">
          {data.dealerHealth.map((row) => (
            <Link
              key={row.dealerId}
              href={`/dealers/view/?id=${row.dealerId}`}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              prefetch={false}
            >
              <span
                aria-hidden="true"
                className={cn("size-2.5 shrink-0 rounded-full", healthDot[row.health])}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{row.name}</span>
                <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin size={11} aria-hidden="true" />
                  {row.region}
                  <span aria-hidden="true">·</span>
                  <span className="sr-only">Status:</span>
                  {healthLabel[row.health]}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-semibold tabular-nums text-foreground">
                  {row.loadPer100 !== null ? `${row.loadPer100.toFixed(0)}/100` : "—"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {row.openRequests} open · {row.fieldedUnits} units
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </DetailSection>
  );
}
