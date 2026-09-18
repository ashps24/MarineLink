"use client";

import Link from "next/link";
import {
  Wrench,
  ClipboardText,
  Buildings,
  UsersThree,
  MapPin,
  CalendarBlank,
  Wrench as WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DetailHeader } from "@/components/shared/detail-header";
import { DetailSection } from "@/components/shared/detail-section";
import { KeyValueList } from "@/components/shared/key-value-list";
import { RelatedRecordCard } from "@/components/shared/related-record-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { DetailSkeleton, ListSkeleton } from "@/components/shared/loading-skeleton";
import { RestrictedState } from "@/components/shared/restricted-state";
import { ConfirmableActionPlaceholder } from "@/components/shared/confirmable-action-placeholder";
import { EquipmentImage } from "./equipment-image";
import { useEquipmentItem } from "@/hooks/use-equipment";
import { useCustomer } from "@/hooks/use-customers";
import { useDealer } from "@/hooks/use-dealers";
import { useServiceRequests } from "@/hooks/use-service-requests";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate, formatRelativeTime } from "@/lib/formatting/date";

/**
 * Equipment record. The identification block is common to every role; the
 * customer and dealer context below it only renders for roles allowed to see
 * the other side of the relationship.
 */
export function EquipmentDetail({ equipmentId }: { equipmentId: string }) {
  const { user } = useCurrentUser();
  const { data: item, isPending, isError, refetch } = useEquipmentItem(equipmentId);
  const { data: customer } = useCustomer(item?.customerId);
  const { data: dealer } = useDealer(item?.dealerId);
  const { data: requests, isPending: requestsPending } = useServiceRequests({
    equipmentId,
  });

  if (isPending) return <DetailSkeleton />;

  if (isError) {
    return (
      <ErrorState
        title="Could not load this equipment"
        description="The equipment service did not respond."
        onRetry={() => refetch()}
      />
    );
  }

  if (!item) {
    return (
      <RestrictedState
        title="Equipment not available"
        description="This unit either does not exist or is outside what your role can see."
      />
    );
  }

  const showRelationships = user.role !== "customer";

  return (
    <div className="space-y-6">
      <DetailHeader
        name={item.name}
        eyebrow={item.equipmentType}
        backHref="/equipment"
        backLabel="Product Catalog"
        badges={
          <>
            <StatusBadge kind="equipment" status={item.currentStatus} />
            {item.location ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin size={12} aria-hidden="true" />
                {item.location}
              </span>
            ) : null}
            {item.commissionedDate ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarBlank size={12} aria-hidden="true" />
                Commissioned {formatDate(item.commissionedDate)}
              </span>
            ) : null}
          </>
        }
        actions={
          <ConfirmableActionPlaceholder
            label="Request service"
            description="Creating service requests arrives in a later phase. This build is view-and-track only."
            icon={<WrenchIcon aria-hidden="true" />}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <EquipmentImage
            item={item}
            width={1280}
            sizes="(min-width: 1024px) 56rem, 92vw"
            priority
            rounded="rounded-2xl"
            className="aspect-[21/9] w-full border border-border"
          />

          <DetailSection title="Identification" description="Core record for this unit">
            <KeyValueList
              columns={2}
              entries={[
                { label: "Equipment name", value: item.name },
                { label: "Type", value: item.equipmentType },
                { label: "Model", value: item.model },
                { label: "Serial number", value: item.serialNumber, mono: true },
                {
                  label: "Current status",
                  value: <StatusBadge kind="equipment" status={item.currentStatus} />,
                },
                ...(item.liftCapacityTons
                  ? [{ label: "Rated capacity", value: `${item.liftCapacityTons} tons` }]
                  : []),
              ]}
            />
          </DetailSection>

          <DetailSection
            title="Service history"
            description="Requests raised against this unit"
            contentClassName="p-4"
            action={
              <Link
                href="/service"
                className="rounded-md text-xs font-medium text-ocean hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                View all
              </Link>
            }
          >
            {requestsPending ? (
              <ListSkeleton count={3} label="Loading service history" />
            ) : (requests ?? []).length === 0 ? (
              <EmptyState
                icon={ClipboardText}
                title="No service requests"
                description="Nothing has been raised against this unit."
              />
            ) : (
              <div className="space-y-2">
                {(requests ?? []).map((request) => (
                  <RelatedRecordCard
                    key={request.id}
                    href={`/service/${request.id}`}
                    title={request.subject}
                    subtitle={`${request.referenceNumber} · updated ${formatRelativeTime(request.updatedAt)}`}
                    icon={ClipboardText}
                    trailing={
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={request.priority} />
                        <StatusBadge kind="service" status={request.status} />
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </DetailSection>
        </div>

        <div className="space-y-6">
          {showRelationships ? (
            <DetailSection
              title="Relationships"
              description="Who owns and supports this unit"
              contentClassName="p-4"
            >
              <div className="space-y-2">
                {customer ? (
                  <RelatedRecordCard
                    href={`/customers/${customer.id}`}
                    title={customer.name}
                    subtitle="Owner"
                    icon={UsersThree}
                    trailing={<StatusBadge kind="customer" status={customer.status} />}
                  />
                ) : null}
                {dealer && user.role === "internal" ? (
                  <RelatedRecordCard
                    href={`/dealers/${dealer.id}`}
                    title={dealer.name}
                    subtitle="Supporting dealer"
                    icon={Buildings}
                    trailing={<StatusBadge kind="dealer" status={dealer.status} />}
                  />
                ) : null}
                {!customer && !dealer ? (
                  <EmptyState icon={Wrench} title="No linked records" />
                ) : null}
              </div>
            </DetailSection>
          ) : null}

          <DetailSection title="Placement" description="Where this unit operates">
            <KeyValueList
              entries={[
                { label: "Location", value: item.location ?? "Not recorded" },
                ...(item.commissionedDate
                  ? [{ label: "Commissioned", value: formatDate(item.commissionedDate) }]
                  : []),
              ]}
            />
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
