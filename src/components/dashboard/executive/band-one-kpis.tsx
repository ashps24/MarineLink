"use client";

import {
  Wrench,
  ClockCounterClockwise,
  Gauge,
  ChartLineUp,
  Package,
} from "@phosphor-icons/react/dist/ssr";
import { KpiTile } from "@/components/shared/kpi-tile";
import { RelatedRecordCard } from "@/components/shared/related-record-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { MetricsSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { DetailSection } from "@/components/shared/detail-section";
import { useExecutiveOverview } from "@/hooks/use-executive";
import { MIN_SAMPLE_FOR_MEDIAN, AGING_THRESHOLD_DAYS } from "@/lib/constants/time";

/**
 * Band 1 — "is anything stopped right now, and are we keeping up?"
 *
 * Five tiles the whole page hangs off. Every one carries a baseline or an
 * explicit sample size rather than a bare count — see the finalized KPI
 * design notes for why each comparison was chosen.
 */
export function BandOneKpis() {
  const { data, isPending, isError, refetch } = useExecutiveOverview();

  if (isPending) return <MetricsSkeleton count={5} />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Could not load the executive overview"
        description="The executive metrics service did not respond."
        onRetry={() => refetch()}
      />
    );
  }

  const { unitsDownNow, agingOpenRequests, medianResolution, serviceLoadIndex, waitingOnParts } = data;
  const longestDown = unitsDownNow.rows[0];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <KpiTile
        index={0}
        label="Units down now"
        value={unitsDownNow.count}
        icon={Wrench}
        emphasis={unitsDownNow.count > 0 ? "critical" : "default"}
        caption={`of ${unitsDownNow.fieldedTotal} fielded units available`}
        comparison={
          longestDown
            ? {
                label: `Longest: ${longestDown.name}, ${longestDown.daysDown}d`,
                direction: "flat",
                sentiment: "bad",
              }
            : { label: "None flagged at intake", direction: "flat", sentiment: "good" }
        }
      />

      <KpiTile
        index={1}
        label="Aging open requests"
        value={agingOpenRequests.count}
        icon={ClockCounterClockwise}
        emphasis={agingOpenRequests.count > 0 ? "critical" : "default"}
        caption={`of ${agingOpenRequests.openTotal} open, over ${AGING_THRESHOLD_DAYS} days`}
        comparison={
          agingOpenRequests.pointChange30d === null
            ? undefined
            : {
                label: `${agingOpenRequests.pointChange30d > 0 ? "+" : ""}${agingOpenRequests.pointChange30d} pts vs 30 days ago`,
                direction:
                  agingOpenRequests.pointChange30d > 0
                    ? "up"
                    : agingOpenRequests.pointChange30d < 0
                      ? "down"
                      : "flat",
                sentiment: agingOpenRequests.pointChange30d > 0 ? "bad" : "good",
              }
        }
      />

      <KpiTile
        index={2}
        label="Median days to resolve"
        value={medianResolution.medianDays !== null ? Math.round(medianResolution.medianDays) : "—"}
        unit={medianResolution.medianDays !== null ? "days" : undefined}
        icon={Gauge}
        insufficientData={
          medianResolution.medianDays === null
            ? `Fewer than ${MIN_SAMPLE_FOR_MEDIAN} closures in the last 90 days (n=${medianResolution.n})`
            : undefined
        }
        caption={
          medianResolution.medianDays !== null
            ? `p90 ${medianResolution.p90Days !== null ? Math.round(medianResolution.p90Days) : "—"}d · n=${medianResolution.n}`
            : undefined
        }
        comparison={
          medianResolution.medianDays !== null && medianResolution.priorMedianDays !== null
            ? {
                label: `${Math.round(medianResolution.priorMedianDays)}d prior 90 days (n=${medianResolution.priorN})`,
                direction:
                  medianResolution.medianDays < medianResolution.priorMedianDays
                    ? "down"
                    : medianResolution.medianDays > medianResolution.priorMedianDays
                      ? "up"
                      : "flat",
                sentiment: medianResolution.medianDays <= medianResolution.priorMedianDays ? "good" : "bad",
              }
            : undefined
        }
      />

      <KpiTile
        index={3}
        label="Service load index"
        value={serviceLoadIndex.current !== null ? serviceLoadIndex.current.toFixed(1) : "—"}
        unit="/ 100 units"
        icon={ChartLineUp}
        trend={serviceLoadIndex.points.slice(-12).map((p) => p.index)}
        trendLabel="Service load index, last 12 months"
        caption={serviceLoadIndex.mtdLabel}
        comparison={
          serviceLoadIndex.priorYear !== null && serviceLoadIndex.current !== null
            ? {
                label: `${serviceLoadIndex.priorYear.toFixed(1)} same month last year`,
                direction:
                  serviceLoadIndex.current > serviceLoadIndex.priorYear
                    ? "up"
                    : serviceLoadIndex.current < serviceLoadIndex.priorYear
                      ? "down"
                      : "flat",
                sentiment: serviceLoadIndex.current <= serviceLoadIndex.priorYear ? "good" : "bad",
              }
            : undefined
        }
      />

      <KpiTile
        index={4}
        label="Waiting on parts"
        value={waitingOnParts.count}
        icon={Package}
        emphasis={waitingOnParts.pastEtaCount > 0 ? "critical" : "default"}
        caption={
          waitingOnParts.medianDwellDays !== null
            ? `Median wait ${Math.round(waitingOnParts.medianDwellDays)}d`
            : undefined
        }
        comparison={{
          label: `${waitingOnParts.noEtaCount} no ETA · ${waitingOnParts.pastEtaCount} past ETA`,
          direction: waitingOnParts.pastEtaCount > 0 ? "up" : "flat",
          sentiment: waitingOnParts.pastEtaCount > 0 ? "bad" : "neutral",
        }}
      />

      {unitsDownNow.rows.length > 0 ? (
        <div className="sm:col-span-2 xl:col-span-5">
          <DetailSection
            title="Units down, longest first"
            description="Flagged at intake — a unit partly restored mid-ticket may still show here"
            contentClassName="p-4"
          >
            <div className="grid gap-2 sm:grid-cols-3">
              {unitsDownNow.rows.slice(0, 3).map((row) => (
                <RelatedRecordCard
                  key={row.equipmentId}
                  href={`/equipment/view/?id=${row.equipmentId}`}
                  title={row.name}
                  subtitle={`${row.customerName ?? "Unassigned"} · ${row.daysDown}d down`}
                  icon={Wrench}
                  trailing={
                    row.requestStatus ? (
                      <StatusBadge kind="service" status={row.requestStatus} />
                    ) : undefined
                  }
                />
              ))}
            </div>
          </DetailSection>
        </div>
      ) : null}
    </div>
  );
}
