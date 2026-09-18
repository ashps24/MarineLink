"use client";

import { MagnifyingGlass, CalendarBlank, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import { DetailSection } from "@/components/shared/detail-section";
import { RelatedRecordCard } from "@/components/shared/related-record-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { useExecutiveOverview } from "@/hooks/use-executive";
import { INSPECTION_RECORD_DAYS, FLEET_AGE_THRESHOLD_YEARS } from "@/lib/constants/time";

/**
 * Band 3 — structural signals for the monthly review, not the daily glance.
 * Deliberately below the fold: nothing here changes hour to hour.
 */
export function BandThreePanel() {
  const { data, isPending, isError, refetch } = useExecutiveOverview();

  if (isPending) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <ListSkeleton key={i} count={2} />
        ))}
      </div>
    );
  }
  if (isError || !data) {
    return <ErrorState title="Could not load fleet signals" onRetry={() => refetch()} />;
  }

  const { inspectionCoverage, agedFleet, repeatVisits } = data;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <DetailSection
        title="No inspection on record"
        description={`Overdue past ${INSPECTION_RECORD_DAYS} days, or never reported`}
        contentClassName="p-4"
      >
        <div className="mb-3 flex gap-4 text-sm">
          <span>
            <span className="font-semibold tabular-nums text-destructive">
              {inspectionCoverage.overdueCount}
            </span>{" "}
            <span className="text-muted-foreground">overdue</span>
          </span>
          <span>
            <span className="font-semibold tabular-nums text-muted-foreground">
              {inspectionCoverage.unknownCount}
            </span>{" "}
            <span className="text-muted-foreground">no record</span>
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            of {inspectionCoverage.inServiceTotal} in service
          </span>
        </div>
        {[...inspectionCoverage.overdueRows, ...inspectionCoverage.unknownRows].length === 0 ? (
          <EmptyState icon={CalendarBlank} title="Every in-service unit has a current record" />
        ) : (
          <div className="space-y-2">
            {[...inspectionCoverage.overdueRows, ...inspectionCoverage.unknownRows]
              .slice(0, 4)
              .map((row) => (
                <RelatedRecordCard
                  key={row.equipmentId}
                  href={`/equipment/${row.equipmentId}`}
                  title={row.name}
                  subtitle={
                    row.daysSinceRecord !== null
                      ? `${row.dealerName ?? "Unassigned"} · ${row.daysSinceRecord}d since record`
                      : `${row.dealerName ?? "Unassigned"} · no record on file`
                  }
                  icon={CalendarBlank}
                />
              ))}
          </div>
        )}
      </DetailSection>

      <DetailSection
        title={`Units past ${FLEET_AGE_THRESHOLD_YEARS} years`}
        description={
          agedFleet.medianAgeYears !== null
            ? `Fleet median age ${agedFleet.medianAgeYears.toFixed(1)}y`
            : "Age is exposure, not condition"
        }
        contentClassName="p-4"
      >
        {agedFleet.rows.length === 0 ? (
          <EmptyState icon={MagnifyingGlass} title="No units past the age threshold" />
        ) : (
          <div className="space-y-2">
            {agedFleet.rows.slice(0, 4).map((row) => (
              <RelatedRecordCard
                key={row.equipmentId}
                href={`/equipment/${row.equipmentId}`}
                title={row.name}
                subtitle={`${row.ageYears}y old${row.liftCapacityTons ? ` · ${row.liftCapacityTons}t` : ""}`}
                icon={CalendarBlank}
              />
            ))}
          </div>
        )}
      </DetailSection>

      <DetailSection
        title="Repeat corrective visits"
        description="3 or more corrective requests in 12 months"
        contentClassName="p-4"
      >
        {repeatVisits.top.length === 0 ? (
          <EmptyState icon={ArrowsClockwise} title="No unit has repeated corrective work" />
        ) : (
          <div className="space-y-2">
            {repeatVisits.top.map((row) => (
              <RelatedRecordCard
                key={row.equipmentId}
                href={`/service?equipmentId=${row.equipmentId}`}
                title={row.name}
                subtitle={`${row.model} · ${row.customerName ?? "Unassigned"} · ${row.visitCount} visits`}
                icon={ArrowsClockwise}
              />
            ))}
          </div>
        )}
      </DetailSection>
    </div>
  );
}
