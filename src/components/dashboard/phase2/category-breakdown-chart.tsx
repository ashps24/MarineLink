"use client";

import { DetailSection } from "@/components/shared/detail-section";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { BarList } from "@/components/charts/bar-list";
import { usePhase2Dashboard } from "@/hooks/use-phase2-dashboard";
import { Package } from "@phosphor-icons/react/dist/ssr";

/**
 * Which product lines generate the most service volume — grouped by the real
 * Marine Travelift catalogue category each fielded unit belongs to, not by
 * individual model.
 */
export function CategoryBreakdownChart() {
  const { data, isPending, isError, refetch } = usePhase2Dashboard();

  return (
    <DetailSection
      title="Equipment category breakdown"
      description="Service volume by product line"
      contentClassName="p-4"
    >
      {isPending ? (
        <ListSkeleton count={4} label="Loading category breakdown" />
      ) : isError || !data ? (
        <ErrorState
          title="Could not load the category breakdown"
          description="The dashboard service did not respond."
          onRetry={() => refetch()}
        />
      ) : data.categoryBreakdown.length === 0 ? (
        <EmptyState icon={Package} title="No linked equipment categories yet" />
      ) : (
        <BarList
          caption="Service requests by equipment category"
          valueLabel="Requests"
          data={data.categoryBreakdown.map((row) => ({
            key: row.categoryId,
            label: row.categoryName,
            value: row.requestCount,
            detail: `· ${row.fieldedUnits} unit${row.fieldedUnits === 1 ? "" : "s"} fielded`,
          }))}
        />
      )}
    </DetailSection>
  );
}
