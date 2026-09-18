"use client";

import Link from "next/link";
import { UserCircle, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { DashboardGreeting } from "./dashboard-greeting";
import { SummaryMetrics } from "./summary-metrics";
import { AttentionQueue } from "./attention-queue";
import { EquipmentPreview } from "./equipment-preview";
import { RecentActivity } from "./recent-activity";
import type { User } from "@/types";

/**
 * Customer view. Deliberately lighter than the internal dashboard — equipment
 * status and service progress, nothing operational about other accounts.
 */
export function CustomerDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <DashboardGreeting
        user={user}
        description={`Equipment and open service requests for ${user.organizationName}.`}
        actions={
          <Button asChild variant="outline" size="lg" className="h-10">
            <Link href={`/customers/${user.organizationId}`}>
              <UserCircle aria-hidden="true" />
              My profile
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <SummaryMetrics role="customer" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <EquipmentPreview
            title="Your equipment"
            description="Units registered to your yard"
          />
          <RecentActivity
            title="Service requests"
            description="Your most recently updated requests"
          />
        </div>

        <div className="space-y-6">
          <AttentionQueue
            title="What needs attention"
            description="Open items on your equipment"
            limit={4}
          />
        </div>
      </div>
    </div>
  );
}
