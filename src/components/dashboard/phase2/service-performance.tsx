"use client";

import * as React from "react";
import { ClipboardText, Timer, Target, Lightning } from "@phosphor-icons/react/dist/ssr";
import { KpiTile, type KpiComparison } from "@/components/shared/kpi-tile";
import { DetailSection } from "@/components/shared/detail-section";
import { MetricsSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { BandPanel, type Band } from "./band-panel";
import { PeriodToggle } from "./period-toggle";
import { DealerPerformancePanel } from "./dealer-performance-panel";
import { usePhase2Dashboard } from "@/hooks/use-phase2-dashboard";
import { RESOLUTION_TARGET_HOURS } from "@/lib/constants/service-workflow";
import type { ComparisonPeriod } from "@/lib/services";
import type { UserRole } from "@/types";

/**
 * Turns a period-over-period move into the three things a tile needs: how it
 * reads, which way it points, and whether that direction is good news.
 * `higherIsBetter` is explicit because the answer differs per metric — more
 * open requests is bad, more target compliance is good.
 */
function comparison(
  changePercent: number | null,
  previousLabel: string,
  higherIsBetter: boolean,
  unit = "%",
): KpiComparison | undefined {
  if (changePercent === null) return undefined;

  const rounded = Math.round(changePercent);
  const direction = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  const sentiment =
    rounded === 0 ? "neutral" : rounded > 0 === higherIsBetter ? "good" : "bad";

  return {
    label: `${rounded > 0 ? "+" : ""}${rounded}${unit} vs ${previousLabel}`,
    direction,
    sentiment,
  };
}

/**
 * A percentage with no sample size behind it invites a reader to treat one
 * breached closure as a collapse, so the count travels with the figure.
 */
function targetsCaption(n: number): string {
  const targets = `urgent ${RESOLUTION_TARGET_HOURS.urgent}h · high ${RESOLUTION_TARGET_HOURS.high}h · medium ${Math.round(RESOLUTION_TARGET_HOURS.medium / 24)}d · low ${Math.round(RESOLUTION_TARGET_HOURS.low / 24)}d`;
  return `${n} ${n === 1 ? "closure" : "closures"} · ${targets}`;
}

export function ServicePerformance({ role }: { role: UserRole }) {
  const [period, setPeriod] = React.useState<ComparisonPeriod>("month");
  const { data, isPending, isError, refetch } = usePhase2Dashboard(period);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight">Service performance</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Measured over {data?.windows.label ?? "this month"}, against the period before it.
        </p>
      </div>
      <PeriodToggle value={period} onChange={setPeriod} />
    </div>
  );

  if (isPending) {
    return (
      <div className="space-y-4">
        {header}
        <MetricsSkeleton count={4} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        {header}
        <ErrorState
          title="Could not load dashboard metrics"
          description="The dashboard service did not respond."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { openRequestsTrend, resolutionTrend, slaCompliance, responseTime, urgencyMix, repeatService, warrantyMix, windows } = data;

  const urgencyBands: Band[] = [
    { key: "critical", label: "Critical", count: urgencyMix[0].count, tone: "danger", href: "/service?priority=urgent" },
    { key: "high", label: "High", count: urgencyMix[1].count, tone: "warning", href: "/service?priority=high" },
    { key: "normal", label: "Normal", count: urgencyMix[2].count, tone: "info", href: "/service" },
  ];

  const warrantyBands: Band[] = [
    { key: "active", label: "Active", count: warrantyMix[0].count, tone: "success" },
    { key: "expiring", label: "Expiring in 90 days", count: warrantyMix[1].count, tone: "warning" },
    { key: "expired", label: "Expired", count: warrantyMix[2].count, tone: "danger" },
    { key: "none", label: "No contract", count: warrantyMix[3].count, tone: "neutral" },
  ];

  return (
    <section className="space-y-4">
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          index={0}
          label="Open service requests"
          value={openRequestsTrend.count}
          icon={ClipboardText}
          emphasis={(openRequestsTrend.changePercent ?? 0) > 0 ? "critical" : "default"}
          comparison={comparison(openRequestsTrend.changePercent, windows.previousLabel, false)}
          trend={openRequestsTrend.trend}
          trendLabel="Open requests over the period"
          caption="Open the service queue"
          href="/service"
        />

        <KpiTile
          index={1}
          label="Time to resolution"
          value={resolutionTrend.averageDays !== null ? resolutionTrend.averageDays.toFixed(1) : "—"}
          unit={resolutionTrend.averageDays !== null ? "days avg" : undefined}
          icon={Timer}
          insufficientData={
            resolutionTrend.averageDays === null
              ? `Nothing closed ${windows.label} yet`
              : undefined
          }
          comparison={comparison(resolutionTrend.changePercent, windows.previousLabel, false)}
          trend={resolutionTrend.trend}
          trendLabel="Resolution time over the period"
          caption={`From ${resolutionTrend.n} ${resolutionTrend.n === 1 ? "closure" : "closures"}`}
        />

        <KpiTile
          index={2}
          label="Target compliance"
          value={slaCompliance.percent !== null ? Math.round(slaCompliance.percent) : "—"}
          unit={slaCompliance.percent !== null ? "%" : undefined}
          icon={Target}
          emphasis={
            slaCompliance.percent !== null && slaCompliance.percent < 80 ? "critical" : "positive"
          }
          insufficientData={
            slaCompliance.percent === null ? `Nothing closed ${windows.label} yet` : undefined
          }
          comparison={comparison(
            slaCompliance.changePoints,
            windows.previousLabel,
            true,
            " pts",
          )}
          caption={targetsCaption(slaCompliance.n)}
        />

        <KpiTile
          index={3}
          label="Time to first action"
          value={responseTime.averageHours !== null ? responseTime.averageHours.toFixed(1) : "—"}
          unit={responseTime.averageHours !== null ? "hrs avg" : undefined}
          icon={Lightning}
          insufficientData={
            responseTime.averageHours === null
              ? "No requests picked up in this period yet"
              : undefined
          }
          comparison={comparison(responseTime.changePercent, windows.previousLabel, false)}
          caption={`From ${responseTime.n} ${responseTime.n === 1 ? "request" : "requests"}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DetailSection title="Open work by urgency" description="Where the queue is weighted">
          <BandPanel bands={urgencyBands} emptyLabel="Nothing open right now." />
        </DetailSection>

        <DetailSection title="Repeat service" description="Units back within 90 days">
          {repeatService.percent === null ? (
            <p className="text-sm text-muted-foreground">
              No requests raised in the last 90 days.
            </p>
          ) : (
            <>
              <p className="font-heading text-3xl leading-none font-semibold tracking-tight tabular-nums">
                {Math.round(repeatService.percent)}
                <span className="ml-1 text-base font-medium text-muted-foreground">%</span>
              </p>
              <p className="mt-2.5 text-sm text-muted-foreground">
                {repeatService.repeatUnits} of {repeatService.servicedUnits} serviced units
                needed a second visit.
              </p>
            </>
          )}
        </DetailSection>

        <DetailSection title="Contract cover" description="Service contract across the fleet">
          <BandPanel bands={warrantyBands} emptyLabel="No equipment on record." />
        </DetailSection>
      </div>

      {role === "internal" ? <DealerPerformancePanel rows={data.dealerPerformance} /> : null}
    </section>
  );
}
