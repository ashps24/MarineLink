"use client";

import Link from "next/link";
import {
  MapPin,
  EnvelopeSimple,
  Phone,
  UsersThree,
  Wrench,
  ClipboardText,
  CalendarBlank,
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
import { ContactButton } from "@/components/shared/contact-button";
import { MetricCard } from "@/components/shared/metric-card";
import { EquipmentCard } from "@/components/equipment/equipment-card";
import { useDealer } from "@/hooks/use-dealers";
import { useCustomers } from "@/hooks/use-customers";
import { useEquipmentList } from "@/hooks/use-equipment";
import { useServiceRequests } from "@/hooks/use-service-requests";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate, formatRelativeTime } from "@/lib/formatting/date";

/**
 * Dealer record. Internal staff reach it from the directory; a dealer user
 * reaches their own through "My Dealer Profile", where `dealerId` is the alias
 * "me" resolved against the signed-in organization.
 */
export function DealerDetail({ dealerId }: { dealerId: string }) {
  const { user } = useCurrentUser();
  const resolvedId = dealerId === "me" ? user.organizationId : dealerId;

  const { data: dealer, isPending, isError, refetch } = useDealer(resolvedId);
  const { data: customers, isPending: customersPending } = useCustomers({ dealerId: resolvedId });
  const { data: equipment, isPending: equipmentPending } = useEquipmentList({
    dealerId: resolvedId,
  });
  const { data: requests, isPending: requestsPending } = useServiceRequests({
    dealerId: resolvedId,
  });

  if (isPending) return <DetailSkeleton />;

  if (isError) {
    return (
      <ErrorState
        title="Could not load this dealer"
        description="The dealer service did not respond."
        onRetry={() => refetch()}
      />
    );
  }

  if (!dealer) {
    return (
      <RestrictedState
        title="Dealer not available"
        description="This dealer either does not exist or is outside what your role can see."
      />
    );
  }

  const openRequests = (requests ?? []).filter(
    (request) => request.status !== "resolved" && request.status !== "closed",
  );

  return (
    <div className="space-y-6">
      <DetailHeader
        name={dealer.name}
        eyebrow="Dealer"
        backHref={user.role === "dealer" ? "/" : "/dealers"}
        backLabel={user.role === "dealer" ? "Back to dashboard" : "All dealers"}
        badges={
          <>
            <StatusBadge kind="dealer" status={dealer.status} />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} aria-hidden="true" />
              {dealer.region}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarBlank size={12} aria-hidden="true" />
              Partner since {formatDate(dealer.partnerSince)}
            </span>
          </>
        }
        actions={
          <ContactButton
            label="Contact dealer"
            email={dealer.primaryContactEmail}
            name={dealer.primaryContactName}
            subject={`MarineLink — ${dealer.name}`}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Customers"
          value={dealer.customerCount}
          caption="Accounts supported"
          icon={UsersThree}
          index={0}
        />
        <MetricCard
          label="Equipment"
          value={dealer.equipmentCount}
          caption="Units in territory"
          icon={Wrench}
          index={1}
        />
        <MetricCard
          label="Open requests"
          value={dealer.openServiceRequestCount}
          caption="Awaiting resolution"
          icon={ClipboardText}
          emphasis={dealer.openServiceRequestCount > 2 ? "critical" : "default"}
          index={2}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="Equipment in territory" description="Units registered to this dealer">
            {equipmentPending ? (
              <ListSkeleton count={2} label="Loading equipment" />
            ) : (equipment ?? []).length === 0 ? (
              <EmptyState icon={Wrench} title="No equipment on record" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {(equipment ?? []).slice(0, 4).map((item, index) => (
                  <EquipmentCard key={item.id} item={item} index={index} />
                ))}
              </div>
            )}
          </DetailSection>

          <DetailSection
            title="Open service requests"
            description="Requests that have not been resolved"
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
                description="Everything on record for this dealer is resolved or closed."
              />
            ) : (
              <div className="space-y-2">
                {openRequests.slice(0, 5).map((request) => (
                  <RelatedRecordCard
                    key={request.id}
                    href={`/service/view/?id=${request.id}`}
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
          <DetailSection title="Primary contact" description="Day-to-day dealer contact">
            <KeyValueList
              entries={[
                { label: "Name", value: dealer.primaryContactName },
                {
                  label: "Email",
                  value: (
                    <a
                      href={`mailto:${dealer.primaryContactEmail}`}
                      className="inline-flex items-center gap-1.5 text-ocean hover:underline"
                    >
                      <EnvelopeSimple size={14} aria-hidden="true" />
                      {dealer.primaryContactEmail}
                    </a>
                  ),
                },
                {
                  label: "Phone",
                  value: (
                    <a
                      href={`tel:${dealer.primaryContactPhone.replace(/[^\d+]/g, "")}`}
                      className="inline-flex items-center gap-1.5 text-ocean hover:underline"
                    >
                      <Phone size={14} aria-hidden="true" />
                      {dealer.primaryContactPhone}
                    </a>
                  ),
                },
                { label: "Address", value: dealer.address },
              ]}
            />
          </DetailSection>

          <DetailSection
            title="Customers"
            description="Accounts this dealer supports"
            contentClassName="p-4"
          >
            {customersPending ? (
              <ListSkeleton count={3} label="Loading customers" />
            ) : (customers ?? []).length === 0 ? (
              <EmptyState icon={UsersThree} title="No customers on record" />
            ) : (
              <div className="space-y-2">
                {(customers ?? []).map((customer) => (
                  <RelatedRecordCard
                    key={customer.id}
                    href={`/customers/view/?id=${customer.id}`}
                    title={customer.name}
                    subtitle={`${customer.equipmentCount} units · ${customer.openServiceRequestCount} open`}
                    icon={UsersThree}
                    trailing={<StatusBadge kind="customer" status={customer.status} />}
                  />
                ))}
              </div>
            )}
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
