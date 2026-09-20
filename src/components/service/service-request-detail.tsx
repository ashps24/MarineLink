"use client";

import {
  Wrench,
  Buildings,
  UsersThree,
  Users,
  CalendarBlank,
  ClockCounterClockwise,
} from "@phosphor-icons/react/dist/ssr";
import { DetailHeader } from "@/components/shared/detail-header";
import { DetailSection } from "@/components/shared/detail-section";
import { KeyValueList } from "@/components/shared/key-value-list";
import { RelatedRecordCard } from "@/components/shared/related-record-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { RestrictedState } from "@/components/shared/restricted-state";
import { StatusTimeline } from "./status-timeline";
import { useServiceRequest } from "@/hooks/use-service-requests";
import { useEquipmentItem } from "@/hooks/use-equipment";
import { useCustomer } from "@/hooks/use-customers";
import { useDealer } from "@/hooks/use-dealers";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDateTime, formatRelativeTime } from "@/lib/formatting/date";

/** Service request detail: the reported fault, its progress, and what it is against. */
export function ServiceRequestDetail({ requestId }: { requestId: string }) {
  const { user } = useCurrentUser();
  const { data: request, isPending, isError, refetch } = useServiceRequest(requestId);
  const { data: equipment } = useEquipmentItem(request?.equipmentId);
  const { data: customer } = useCustomer(request?.customerId);
  const { data: dealer } = useDealer(request?.dealerId);

  if (isPending) return <DetailSkeleton />;

  if (isError) {
    return (
      <ErrorState
        title="Could not load this request"
        description="The service queue did not respond."
        onRetry={() => refetch()}
      />
    );
  }

  if (!request) {
    return (
      <RestrictedState
        title="Request not available"
        description="This request either does not exist or is outside what your role can see."
      />
    );
  }

  const showCustomer = user.role !== "customer" && customer;
  const showDealer = user.role === "internal" && dealer;

  return (
    <div className="space-y-6">
      <DetailHeader
        name={request.subject}
        eyebrow={request.referenceNumber}
        backHref="/service"
        backLabel="All service requests"
        badges={
          <>
            <StatusBadge kind="service" status={request.status} />
            <PriorityBadge priority={request.priority} />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ClockCounterClockwise size={12} aria-hidden="true" />
              Updated {formatRelativeTime(request.updatedAt)}
            </span>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="Summary" description="What was reported and what has happened">
            <p className="text-sm leading-relaxed text-pretty text-foreground">
              {request.summary}
            </p>
          </DetailSection>

          <DetailSection title="Request details">
            <KeyValueList
              columns={2}
              entries={[
                { label: "Reference", value: request.referenceNumber, mono: true },
                { label: "Assigned team", value: request.assignedTeam },
                {
                  label: "Status",
                  value: <StatusBadge kind="service" status={request.status} />,
                },
                {
                  label: "Priority",
                  value: <PriorityBadge priority={request.priority} />,
                },
                { label: "Created", value: formatDateTime(request.createdAt) },
                { label: "Last updated", value: formatDateTime(request.updatedAt) },
              ]}
            />
          </DetailSection>

          <DetailSection
            title="Related records"
            description="Equipment and accounts this request touches"
            contentClassName="p-4"
          >
            <div className="space-y-2">
              {equipment ? (
                <RelatedRecordCard
                  href={`/equipment/view/?id=${equipment.id}`}
                  title={equipment.name}
                  subtitle={`${equipment.model} · serial ${equipment.serialNumber}`}
                  icon={Wrench}
                  trailing={<StatusBadge kind="equipment" status={equipment.currentStatus} />}
                />
              ) : null}
              {showCustomer ? (
                <RelatedRecordCard
                  href={`/customers/view/?id=${customer.id}`}
                  title={customer.name}
                  subtitle="Customer account"
                  icon={UsersThree}
                  trailing={<StatusBadge kind="customer" status={customer.status} />}
                />
              ) : null}
              {showDealer ? (
                <RelatedRecordCard
                  href={`/dealers/view/?id=${dealer.id}`}
                  title={dealer.name}
                  subtitle="Supporting dealer"
                  icon={Buildings}
                  trailing={<StatusBadge kind="dealer" status={dealer.status} />}
                />
              ) : null}
              {!equipment && !showCustomer && !showDealer ? (
                <EmptyState icon={Wrench} title="No linked records" />
              ) : null}
            </div>
          </DetailSection>
        </div>

        <div className="space-y-6">
          <DetailSection title="Progress" description="Where this request sits today">
            <StatusTimeline status={request.status} />
          </DetailSection>

          <DetailSection title="Handling">
            <KeyValueList
              entries={[
                {
                  label: "Assigned team",
                  value: (
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={14} aria-hidden="true" className="text-muted-foreground" />
                      {request.assignedTeam}
                    </span>
                  ),
                },
                {
                  label: "Raised",
                  value: (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarBlank size={14} aria-hidden="true" className="text-muted-foreground" />
                      {formatDateTime(request.createdAt)}
                    </span>
                  ),
                },
              ]}
            />
            <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
              Updating, assigning, and closing requests arrive with the service backend. This
              build tracks status only.
            </p>
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
