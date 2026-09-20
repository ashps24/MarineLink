"use client";

import Link from "next/link";
import { Buildings, UsersThree, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { DashboardGreeting } from "./dashboard-greeting";
import { AttentionQueue } from "./attention-queue";
import { RecentActivity } from "./recent-activity";
import { EquipmentPreview } from "./equipment-preview";
import { ServicePerformance } from "./phase2/service-performance";
import { PipelineChart } from "./phase2/pipeline-chart";
import { VolumeTrendChart } from "./phase2/volume-trend-chart";
import { CategoryBreakdownChart } from "./phase2/category-breakdown-chart";
import { DetailSection } from "@/components/shared/detail-section";
import { RelatedRecordCard } from "@/components/shared/related-record-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { useCustomers } from "@/hooks/use-customers";
import type { User } from "@/types";

/**
 * Dealer view. Scoped entirely to the signed-in dealer organization — no
 * company-wide metrics and no other dealers.
 */
export function DealerDashboard({ user }: { user: User }) {
  const { data: customers, isPending, isError, refetch } = useCustomers();
  const accounts = (customers ?? []).slice(0, 4);

  return (
    <div className="space-y-6">
      <DashboardGreeting
        user={user}
        description={`Service activity and equipment across ${user.organizationName}.`}
        actions={
          <Button asChild variant="outline" size="lg" className="h-10">
            <Link prefetch={false} href={`/dealers/view/?id=${user.organizationId}`}>
              <Buildings aria-hidden="true" />
              Dealer profile
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <ServicePerformance role="dealer" />

      <PipelineChart />

      <div className="grid gap-6 lg:grid-cols-2">
        <VolumeTrendChart />
        <CategoryBreakdownChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AttentionQueue description="Requests and equipment in your territory that need action" />
          <EquipmentPreview
            title="Equipment you support"
            description="Units registered to your dealership"
          />
        </div>

        <div className="space-y-6">
          <RecentActivity description="Latest updates on your requests" />

          <DetailSection
            title="Your customers"
            description="Accounts you support"
            contentClassName="p-4"
            action={
              <Link prefetch={false}
                href="/customers"
                className="rounded-md text-xs font-medium text-ocean hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                View all
              </Link>
            }
          >
            {isPending ? (
              <ListSkeleton count={3} label="Loading customers" />
            ) : isError ? (
              <ErrorState
                title="Could not load customers"
                description="The customer service did not respond."
                onRetry={() => refetch()}
              />
            ) : accounts.length === 0 ? (
              <EmptyState icon={UsersThree} title="No customers on record" />
            ) : (
              <div className="space-y-2">
                {accounts.map((customer) => (
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
