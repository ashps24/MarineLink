"use client";

import { DetailSection } from "@/components/shared/detail-section";
import { ErrorState } from "@/components/shared/error-state";
import { ChartDataTable } from "@/components/charts/chart-frame";
import { Skeleton } from "@/components/ui/skeleton";
import { usePhase2Dashboard } from "@/hooks/use-phase2-dashboard";
import { serviceStatusConfig } from "@/lib/constants/status";
import type { SemanticTone } from "@/lib/constants/status";
import { cn } from "@/lib/utils";

const barClasses: Record<SemanticTone, string> = {
  neutral: "bg-muted-foreground/40",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

/**
 * Service pipeline: New -> In Progress -> Waiting on Parts -> Resolved (and
 * Closed once archived). A horizontal stacked bar with a per-stage count
 * beneath it — a funnel implies drop-off between exclusive stages, but a
 * request can sit in exactly one status at a time without ever "failing out",
 * so a stacked bar is the honest shape for this data.
 */
export function PipelineChart() {
  const { data, isPending, isError, refetch } = usePhase2Dashboard();

  return (
    <DetailSection
      title="Service pipeline"
      description="Every request you can see, by current status"
    >
      {isPending ? (
        <div className="space-y-3">
          <span role="status" aria-live="polite" className="sr-only">
            Loading service pipeline
          </span>
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ) : isError || !data ? (
        <ErrorState
          title="Could not load the pipeline"
          description="The service summary did not respond."
          onRetry={() => refetch()}
        />
      ) : data.pipeline.every((s) => s.count === 0) ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No service requests on record.
        </p>
      ) : (
        <div className="space-y-4">
          <div
            className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={data.pipeline
              .filter((s) => s.count > 0)
              .map((s) => `${s.count} ${serviceStatusConfig[s.status].label}`)
              .join(", ")}
          >
            {data.pipeline
              .filter((s) => s.count > 0)
              .map((stage) => {
                const total = data.pipeline.reduce((sum, s) => sum + s.count, 0);
                return (
                  <span
                    key={stage.status}
                    className={cn("h-full", barClasses[serviceStatusConfig[stage.status].tone])}
                    style={{ width: `${(stage.count / total) * 100}%` }}
                  />
                );
              })}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {data.pipeline.map((stage) => {
              const config = serviceStatusConfig[stage.status];
              return (
                <div key={stage.status} className="rounded-xl border border-border p-3">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className={cn("size-2 shrink-0 rounded-full", barClasses[config.tone])}
                    />
                    {config.label}
                  </p>
                  <p className="mt-1.5 font-heading text-xl font-semibold tabular-nums text-foreground">
                    {stage.count}
                  </p>
                </div>
              );
            })}
          </div>

          <ChartDataTable
            caption="Service pipeline by status"
            columnLabel="Status"
            columns={["Requests"]}
            rows={data.pipeline.map((s) => ({
              label: serviceStatusConfig[s.status].label,
              values: [s.count],
            }))}
          />
        </div>
      )}
    </DetailSection>
  );
}
