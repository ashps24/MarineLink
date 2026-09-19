"use client";

import Link from "next/link";
import { DetailSection } from "@/components/shared/detail-section";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useServiceStatusBreakdown } from "@/hooks/use-dashboard";
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
 * Where service work currently sits. A proportional bar rather than a chart
 * library — this is one dimension of data and does not need axes.
 */
export function ServiceStatusSummary() {
  const { data, isPending, isError, refetch } = useServiceStatusBreakdown();
  const rows = data ?? [];
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <DetailSection
      title="Service pipeline"
      description="Every request you can see, by status"
      action={
        <Link prefetch={false}
          href="/service"
          className="rounded-md text-xs font-medium text-ocean hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          View all
        </Link>
      }
    >
      {isPending ? (
        <div className="space-y-3">
          <span role="status" aria-live="polite" className="sr-only">
            Loading service pipeline
          </span>
          <Skeleton className="h-2.5 w-full rounded-full" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load the pipeline"
          description="The service summary did not respond."
          onRetry={() => refetch()}
        />
      ) : total === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No service requests on record.
        </p>
      ) : (
        <div className="space-y-4">
          <div
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={rows
              .filter((row) => row.count > 0)
              .map((row) => `${row.count} ${serviceStatusConfig[row.status].label}`)
              .join(", ")}
          >
            {rows
              .filter((row) => row.count > 0)
              .map((row) => (
                <span
                  key={row.status}
                  className={cn("h-full", barClasses[serviceStatusConfig[row.status].tone])}
                  style={{ width: `${(row.count / total) * 100}%` }}
                />
              ))}
          </div>

          <ul className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
            {rows.map((row) => {
              const config = serviceStatusConfig[row.status];
              return (
                <li key={row.status}>
                  <Link prefetch={false}
                    href={`/service?status=${row.status}`}
                    className="group flex items-center gap-2 rounded-md py-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span
                      aria-hidden="true"
                      className={cn("size-2 shrink-0 rounded-full", barClasses[config.tone])}
                    />
                    <span className="truncate text-sm text-muted-foreground group-hover:text-foreground">
                      {config.label}
                    </span>
                    <span className="ml-auto text-sm font-semibold tabular-nums text-foreground">
                      {row.count}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </DetailSection>
  );
}
