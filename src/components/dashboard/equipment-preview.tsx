"use client";

import Link from "next/link";
import { Wrench } from "@phosphor-icons/react/dist/ssr";
import { DetailSection } from "@/components/shared/detail-section";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { EquipmentCard } from "@/components/equipment/equipment-card";
import { useEquipmentList } from "@/hooks/use-equipment";

export function EquipmentPreview({
  title = "Your equipment",
  description = "Units on record",
  limit = 4,
}: {
  title?: string;
  description?: string;
  limit?: number;
}) {
  const { data, isPending, isError, refetch } = useEquipmentList();
  const items = data?.slice(0, limit) ?? [];

  return (
    <DetailSection
      title={title}
      description={description}
      action={
        <Link
          href="/equipment"
          className="rounded-md text-xs font-medium text-ocean hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          View all
        </Link>
      }
    >
      {isPending ? (
        <CardGridSkeleton count={2} label="Loading equipment" className="sm:grid-cols-2 xl:grid-cols-2" />
      ) : isError ? (
        <ErrorState
          title="Could not load equipment"
          description="The equipment service did not respond."
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No equipment on record"
          description="Equipment appears here once it is registered to your organization."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item, index) => (
            <EquipmentCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </DetailSection>
  );
}
