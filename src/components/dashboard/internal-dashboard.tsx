"use client";

import Link from "next/link";
import { Buildings, UsersThree, Wrench, ClipboardText } from "@phosphor-icons/react/dist/ssr";
import { DashboardGreeting } from "./dashboard-greeting";
import { SummaryMetrics } from "./summary-metrics";
import { AttentionQueue } from "./attention-queue";
import { ServiceStatusSummary } from "./service-status-summary";
import { RecentActivity } from "./recent-activity";
import { DetailSection } from "@/components/shared/detail-section";
import { RelatedRecordCard } from "@/components/shared/related-record-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ListSkeleton } from "@/components/shared/loading-skeleton";
import { useDealers } from "@/hooks/use-dealers";
import type { User } from "@/types";

const quickLinks = [
  { href: "/dealers", label: "Dealers", description: "Network directory", icon: Buildings },
  { href: "/customers", label: "Customers", description: "All accounts", icon: UsersThree },
  { href: "/equipment", label: "Equipment", description: "Every unit", icon: Wrench },
  { href: "/service", label: "Service", description: "Request queue", icon: ClipboardText },
];

/**
 * Leadership view. Ordered so "what needs my attention?" is answerable without
 * scrolling on a laptop.
 */
export function InternalDashboard({ user }: { user: User }) {
  const { data: dealers, isPending } = useDealers();
  const dealerHighlights = (dealers ?? [])
    .slice()
    .sort((a, b) => b.openServiceRequestCount - a.openServiceRequestCount)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <DashboardGreeting
        user={user}
        description="Service load, dealer network health, and the records that need a decision today."
      />

      <SummaryMetrics role="internal" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AttentionQueue />
          <RecentActivity />
        </div>

        <div className="space-y-6">
          <ServiceStatusSummary />

          <DetailSection
            title="Dealer activity"
            description="Busiest dealers by open requests"
            contentClassName="p-4"
            action={
              <Link
                href="/dealers"
                className="rounded-md text-xs font-medium text-ocean hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                View all
              </Link>
            }
          >
            {isPending ? (
              <ListSkeleton count={3} label="Loading dealer activity" />
            ) : (
              <div className="space-y-2">
                {dealerHighlights.map((dealer) => (
                  <RelatedRecordCard
                    key={dealer.id}
                    href={`/dealers/${dealer.id}`}
                    title={dealer.name}
                    subtitle={`${dealer.region} · ${dealer.openServiceRequestCount} open`}
                    icon={Buildings}
                    trailing={<StatusBadge kind="dealer" status={dealer.status} />}
                  />
                ))}
              </div>
            )}
          </DetailSection>

          <DetailSection title="Jump to" description="Directories and queues" contentClassName="p-4">
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map((link) => {
                const LinkIcon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-3 transition-all hover:border-ocean/40 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-ocean/10 group-hover:text-ocean">
                      <LinkIcon size={16} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-foreground">{link.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {link.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
