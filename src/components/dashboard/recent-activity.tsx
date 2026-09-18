"use client";

import Link from "next/link";
import { ClipboardText } from "@phosphor-icons/react/dist/ssr";
import { DetailSection } from "@/components/shared/detail-section";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { RelatedRecordCard } from "@/components/shared/related-record-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useRecentServiceActivity } from "@/hooks/use-dashboard";
import { formatRelativeTime } from "@/lib/formatting/date";

export function RecentActivity({
  title = "Recent service updates",
  description = "The most recently updated requests",
  limit = 5,
}: {
  title?: string;
  description?: string;
  limit?: number;
}) {
  const { data, isPending, isError, refetch } = useRecentServiceActivity(limit);
  const requests = data ?? [];

  return (
    <DetailSection
      title={title}
      description={description}
      action={
        <Link
          href="/service"
          className="rounded-md text-xs font-medium text-ocean hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          View all
        </Link>
      }
      contentClassName="p-4"
    >
      {isPending ? (
        <ListSkeleton count={3} label="Loading recent activity" />
      ) : isError ? (
        <ErrorState
          title="Could not load recent activity"
          description="The service feed did not respond."
          onRetry={() => refetch()}
        />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={ClipboardText}
          title="No service activity yet"
          description="Updates appear here as requests progress."
        />
      ) : (
        <div className="space-y-2">
          {requests.map((request) => (
            <RelatedRecordCard
              key={request.id}
              href={`/service/${request.id}`}
              title={request.subject}
              subtitle={`${request.referenceNumber} · updated ${formatRelativeTime(request.updatedAt)}`}
              icon={ClipboardText}
              trailing={<StatusBadge kind="service" status={request.status} />}
            />
          ))}
        </div>
      )}
    </DetailSection>
  );
}
