"use client";

import {
  ClipboardText,
  WarningCircle,
  Buildings,
  Wrench,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { MetricCard } from "@/components/shared/metric-card";
import { MetricsSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import type { UserRole } from "@/types";

/** Which four numbers matter depends on who is looking. */
export function SummaryMetrics({ role }: { role: UserRole }) {
  const { data, isPending, isError, refetch } = useDashboardSummary();

  if (isPending) return <MetricsSkeleton count={4} />;
  if (isError) {
    return (
      <ErrorState
        title="Could not load summary metrics"
        description="The dashboard service did not respond."
        onRetry={() => refetch()}
      />
    );
  }

  const summary = data;

  const cards =
    role === "internal"
      ? [
          {
            label: "Open service requests",
            value: summary.openServiceRequests,
            caption: "Across all dealers",
            icon: ClipboardText,
            href: "/service?status=new",
          },
          {
            label: "High priority",
            value: summary.highPriorityRequests,
            caption: "Urgent and high, still open",
            icon: WarningCircle,
            href: "/service?priority=urgent",
            emphasis: "critical" as const,
          },
          {
            label: "Active dealers",
            value: summary.activeDealers,
            caption: "View dealer network",
            icon: Buildings,
            href: "/dealers?status=active",
          },
          {
            label: "Active equipment",
            value: summary.activeEquipment,
            caption: "Units in normal service",
            icon: Wrench,
            href: "/equipment?status=active",
          },
        ]
      : role === "dealer"
        ? [
            {
              label: "Open service requests",
              value: summary.openServiceRequests,
              caption: "For your organization",
              icon: ClipboardText,
              href: "/service",
            },
            {
              label: "High priority",
              value: summary.highPriorityRequests,
              caption: "Urgent and high, still open",
              icon: WarningCircle,
              href: "/service?priority=urgent",
              emphasis: "critical" as const,
            },
            {
              label: "Customers",
              value: summary.activeCustomers ?? 0,
              caption: "Active accounts you support",
              icon: UsersThree,
              href: "/customers",
            },
            {
              label: "Active equipment",
              value: summary.activeEquipment,
              caption: "Units in normal service",
              icon: Wrench,
              href: "/equipment",
            },
          ]
        : [
            {
              label: "Open service requests",
              value: summary.openServiceRequests,
              caption: "On your equipment",
              icon: ClipboardText,
              href: "/service",
            },
            {
              label: "High priority",
              value: summary.highPriorityRequests,
              caption: "Urgent and high, still open",
              icon: WarningCircle,
              href: "/service?priority=urgent",
              emphasis: "critical" as const,
            },
            {
              label: "Active equipment",
              value: summary.activeEquipment,
              caption: "Units in normal service",
              icon: Wrench,
              href: "/equipment",
            },
          ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <MetricCard key={card.label} {...card} index={index} />
      ))}
    </div>
  );
}
