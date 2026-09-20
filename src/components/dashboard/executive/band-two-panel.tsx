"use client";

import Link from "next/link";
import { Buildings, Wrench, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { DetailSection } from "@/components/shared/detail-section";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { useExecutiveOverview } from "@/hooks/use-executive";
import { cn } from "@/lib/utils";

/**
 * Band 2 — "who do I call?" Converts Band 1's numbers into named dealers and
 * accounts. Composed as two independent cards (rather than one fixed grid) so
 * the dashboard can place them beside the attention queue rather than beside
 * each other.
 */

export function DealerLoadPanel({ className }: { className?: string }) {
  const { data, isPending, isError, refetch } = useExecutiveOverview();

  if (isPending) return <ListSkeleton count={4} className={className} />;
  if (isError || !data) {
    return (
      <ErrorState
        className={className}
        title="Could not load dealer load data"
        onRetry={() => refetch()}
      />
    );
  }

  const { dealerLoad } = data;

  return (
    <DetailSection
      title="Dealer load, per 100 units"
      description="Open requests relative to each dealer's fielded fleet — not raw count"
      className={className}
      contentClassName="p-0"
    >
      {dealerLoad.rows.length === 0 ? (
        <EmptyState className="border-0" title="No dealers to compare" />
      ) : (
        <div className="divide-y divide-border">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-5 py-2 text-xs font-medium text-muted-foreground">
            <span>Dealer</span>
            <span className="text-right">Open / 100 units</span>
            <span className="text-right">Median resolve</span>
          </div>
          {dealerLoad.rows.map((row) => (
            <Link prefetch={false}
              key={row.dealerId}
              href={`/dealers/view/?id=${row.dealerId}`}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {row.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {row.units} units · {row.openLoad} open
                </span>
              </span>
              <span
                className={cn(
                  "text-right text-sm font-semibold tabular-nums",
                  row.loadPer100 !== null &&
                    dealerLoad.networkMedianPer100 !== null &&
                    row.loadPer100 > dealerLoad.networkMedianPer100 * 1.5
                    ? "text-destructive"
                    : "text-foreground",
                )}
              >
                {row.loadPer100 !== null ? row.loadPer100.toFixed(0) : "—"}
              </span>
              <span className="text-right text-sm tabular-nums text-muted-foreground">
                {row.medianResolveDays !== null
                  ? `${Math.round(row.medianResolveDays)}d`
                  : "—"}
              </span>
            </Link>
          ))}
          {dealerLoad.networkMedianPer100 !== null ? (
            <p className="px-5 py-2.5 text-xs text-muted-foreground">
              Network median: {dealerLoad.networkMedianPer100.toFixed(0)} open
              per 100 units
            </p>
          ) : null}
        </div>
      )}
    </DetailSection>
  );
}

export function UncoveredBasePanel({ className }: { className?: string }) {
  const { data, isPending, isError, refetch } = useExecutiveOverview();

  if (isPending) return <ListSkeleton count={2} className={className} />;
  if (isError || !data) {
    return (
      <ErrorState
        className={className}
        title="Could not load coverage data"
        onRetry={() => refetch()}
      />
    );
  }

  const { uncoveredInstalledBase } = data;

  return (
    <DetailSection
      title="Units, no active dealer"
      description="Installed base without an active dealer of record"
      className={className}
      contentClassName="p-4"
    >
      {uncoveredInstalledBase.count === 0 ? (
        <EmptyState
          icon={Buildings}
          title="Full coverage"
          description="Every fielded unit sits behind an active dealer."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-2xl font-semibold tabular-nums">
              {uncoveredInstalledBase.count}
            </span>
            <span className="text-sm text-muted-foreground">
              units · {uncoveredInstalledBase.liftTonsSum} lift-tons ·{" "}
              {uncoveredInstalledBase.accountCount} account
              {uncoveredInstalledBase.accountCount === 1 ? "" : "s"}
            </span>
          </div>
          {uncoveredInstalledBase.dealers.map((dealer) => (
            <Link prefetch={false}
              key={dealer.dealerId}
              href={`/dealers/view/?id=${dealer.dealerId}`}
              className="group flex items-center gap-2 rounded-lg border border-border bg-background/60 p-2.5 text-sm transition-colors hover:border-ocean/40 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Wrench
                size={14}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
              <span className="min-w-0 flex-1 truncate">
                {dealer.name} · {dealer.region}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {dealer.daysSincePartner}d
              </span>
              <ArrowRight
                size={12}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      )}
    </DetailSection>
  );
}
