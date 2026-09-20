"use client";

import { DetailSection } from "@/components/shared/detail-section";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendChart } from "@/components/charts/trend-chart";
import { usePhase2Dashboard } from "@/hooks/use-phase2-dashboard";

/**
 * Raw request volume, monthly, last 12 months — distinct from the executive
 * "service load index" (which is volume indexed to fleet size). This answers
 * "how much work came in", not "is the burden per machine rising".
 */
export function VolumeTrendChart() {
  const { data, isPending, isError, refetch } = usePhase2Dashboard();

  return (
    <DetailSection title="Service volume trend" description="Requests opened per month, last 12 months">
      {isPending ? (
        <Skeleton className="h-42 w-full" />
      ) : isError || !data ? (
        <ErrorState
          title="Could not load the volume trend"
          description="The dashboard service did not respond."
          onRetry={() => refetch()}
        />
      ) : data.volumeTrend.every((m) => m.opened === 0) ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No service requests in the last 12 months.
        </p>
      ) : (
        <TrendChart
          caption="Service requests opened per month, last 12 months"
          points={data.volumeTrend.map((m) => ({ label: m.label, values: { opened: m.opened } }))}
          series={[{ key: "opened", label: "Requests opened", color: "var(--color-viz-1)" }]}
        />
      )}
    </DetailSection>
  );
}
