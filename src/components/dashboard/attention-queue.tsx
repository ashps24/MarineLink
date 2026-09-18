"use client";

import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { AttentionCard } from "@/components/shared/attention-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { DetailSection } from "@/components/shared/detail-section";
import { useDashboardInsights } from "@/hooks/use-dashboard";

/**
 * The dashboard's primary question: what needs attention right now? Ordered by
 * severity, and every item links to the record it is about.
 */
export function AttentionQueue({
  title = "Needs attention",
  description = "Ranked by urgency across the records you can see",
  limit = 5,
}: {
  title?: string;
  description?: string;
  limit?: number;
}) {
  const { data, isPending, isError, refetch } = useDashboardInsights();
  const insights = data?.slice(0, limit) ?? [];

  return (
    <DetailSection title={title} description={description} contentClassName="p-4">
      {isPending ? (
        <ListSkeleton count={3} label="Loading attention queue" />
      ) : isError ? (
        <ErrorState
          title="Could not load the attention queue"
          description="The insight service did not respond."
          onRetry={() => refetch()}
        />
      ) : insights.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Nothing needs attention"
          description="No urgent requests, holds, or equipment out of service right now."
        />
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <AttentionCard key={insight.id} insight={insight} index={index} />
          ))}
        </div>
      )}
    </DetailSection>
  );
}
