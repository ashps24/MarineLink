"use client";

import Link from "next/link";
import {
  EnvelopeSimple,
  Phone,
  Wrench,
  ClipboardText,
  Buildings,
  CalendarBlank,
  PaperPlaneTilt,
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
import { MetricCard } from "@/components/shared/metric-card";
import { EquipmentCard } from "@/components/equipment/equipment-card";
import { useCustomer } from "@/hooks/use-customers";
import { useDealer } from "@/hooks/use-dealers";
import { useEquipmentList } from "@/hooks/use-equipment";
import { useServiceRequests } from "@/hooks/use-service-requests";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate, formatRelativeTime } from "@/lib/formatting/date";

export function CustomerDetail({ customerId }: { customerId: string }) {
  const { user } = useCurrentUser();
  const resolvedId = customerId === "me" ? user.organizationId : customerId;

  const { data: customer, isPending, isError, refetch } = useCustomer(resolvedId);
  const { data: dealer } = useDealer(customer?.dealerId);
  const { data: equipment, isPending: equipmentPending } = useEquipmentList({
    customerId: resolvedId,
  });
  const { data: requests, isPending: requestsPending } = useServiceRequests({
    customerId: resolvedId,
  });

  if (isPending) return <DetailSkeleton />;

  if (isError) {
    return (
      <ErrorState
        title="Could not load this customer"
        description="The customer service did not respond."
        onRetry={() => refetch()}
      />
    );
  }

  if (!customer) {
    return (
      <RestrictedState
        title="Customer not available"
        description="This account either does not exist or is outside what your role can see."
      />
    );
  }

  const isOwnRecord = user.role === "customer";
  const openRequests = (requests ?? []).filter(
    (request) => request.status !== "resolved" && request.status !== "closed",
  );

  return (
    <div className="space-y-6">
      <DetailHeader
        name={customer.name}
        eyebrow={isOwnRecord ? "Your organization" : "Customer"}
        backHref={isOwnRecord ? "/" : "/customers"}
        backLabel={isOwnRecord ? "Back to dashboard" : "All customers"}
        badges={
          <>
            <StatusBadge kind="customer" status={customer.status} />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarBlank size={12} aria-hidden="true" />
              Customer since {formatDate(customer.customerSince)}
            </span>
          </>
        }
        actions={
          <ConfirmableActionPlaceholder
            label="Contact account"
            description="Messaging needs a real delivery service, which arrives with the backend."
            icon={<PaperPlaneTilt aria-hidden="true" />}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          label="Equipment"
          value={customer.equipmentCount}
          caption="Units on record"
          icon={Wrench}
          index={0}
        />
        <MetricCard
          label="Open requests"
          value={customer.openServiceRequestCount}
          caption="Awaiting resolution"
          icon={ClipboardText}
          emphasis={customer.openServiceRequestCount > 1 ? "critical" : "default"}
          index={1}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="Equipment" description="Units registered to this account">
            {equipmentPending ? (
              <ListSkeleton count={2} label="Loading equipment" />
            ) : (equipment ?? []).length === 0 ? (
              <EmptyState icon={Wrench} title="No equipment on record" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {(equipment ?? []).map((item, index) => (
                  <EquipmentCard key={item.id} item={item} index={index} />
                ))}
              </div>
            )}
          </DetailSection>

          <DetailSection
            title="Service requests"
            description="Open items for this account"
            contentClassName="p-4"
            action={
              <Link prefetch={false}
                href="/service"
                className="rounded-md text-xs font-medium text-ocean hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                View all
              </Link>
            }
          >
            {requestsPending ? (
              <ListSkeleton count={3} label="Loading service requests" />
            ) : openRequests.length === 0 ? (
              <EmptyState
                icon={ClipboardText}
                title="No open requests"
                description="Everything on record for this account is resolved or closed."
              />
            ) : (
              <div className="space-y-2">
                {openRequests.map((request) => (
                  <RelatedRecordCard
                    key={request.id}
                    href={`/service/${request.id}`}
                    title={request.subject}
                    subtitle={`${request.referenceNumber} · updated ${formatRelativeTime(request.updatedAt)}`}
                    icon={ClipboardText}
                    trailing={<PriorityBadge priority={request.priority} />}
                  />
                ))}
              </div>
            )}
          </DetailSection>
        </div>

        <div className="space-y-6">
          <DetailSection title="Primary contact">
            <KeyValueList
              entries={[
                { label: "Name", value: customer.primaryContactName },
                {
                  label: "Email",
                  value: (
                    <a
                      href={`mailto:${customer.primaryContactEmail}`}
                      className="inline-flex items-center gap-1.5 text-ocean hover:underline"
                    >
                      <EnvelopeSimple size={14} aria-hidden="true" />
                      {customer.primaryContactEmail}
                    </a>
                  ),
                },
                {
                  label: "Phone",
                  value: (
                    <a
                      href={`tel:${customer.primaryContactPhone.replace(/[^\d+]/g, "")}`}
                      className="inline-flex items-center gap-1.5 text-ocean hover:underline"
                    >
                      <Phone size={14} aria-hidden="true" />
                      {customer.primaryContactPhone}
                    </a>
                  ),
                },
                { label: "Address", value: customer.address },
                ...(customer.organizationName
                  ? [{ label: "Legal entity", value: customer.organizationName }]
                  : []),
              ]}
            />
          </DetailSection>

          {/* A customer sees who supports them; they do not get the dealer's
            * own directory record. */}
          {dealer ? (
            <DetailSection
              title="Supported by"
              description="Dealer of record"
              contentClassName="p-4"
            >
              {user.role === "customer" ? (
                <div className="rounded-xl border border-border bg-background/60 p-3">
                  <p className="text-sm font-medium text-foreground">{dealer.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{dealer.region}</p>
                  <a
                    href={`mailto:${dealer.primaryContactEmail}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-ocean hover:underline"
                  >
                    <EnvelopeSimple size={12} aria-hidden="true" />
                    {dealer.primaryContactName}
                  </a>
                </div>
              ) : (
                <RelatedRecordCard
                  href={`/dealers/${dealer.id}`}
                  title={dealer.name}
                  subtitle={`${dealer.region} · ${dealer.primaryContactName}`}
                  icon={Buildings}
                  trailing={<StatusBadge kind="dealer" status={dealer.status} />}
                />
              )}
            </DetailSection>
          ) : null}
        </div>
      </div>
    </div>
  );
}
