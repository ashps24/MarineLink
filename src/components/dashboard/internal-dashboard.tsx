"use client";

import { DashboardGreeting } from "./dashboard-greeting";
import { AttentionQueue } from "./attention-queue";
import { RecentActivity } from "./recent-activity";
import { ServicePerformance } from "./phase2/service-performance";
import { PipelineChart } from "./phase2/pipeline-chart";
import { VolumeTrendChart } from "./phase2/volume-trend-chart";
import { CategoryBreakdownChart } from "./phase2/category-breakdown-chart";
import { DealerHealthChart } from "./phase2/dealer-health-chart";
import { UncoveredBasePanel } from "./executive/band-two-panel";
import { BandThreePanel } from "./executive/band-three-panel";
import type { User } from "@/types";

/**
 * Leadership view: KPI row, then the four charts, then "Needs attention",
 * then "Monthly review" — structural signals checked monthly rather than
 * daily, kept below the fold on purpose.
 */
export function InternalDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <DashboardGreeting
        user={user}
        description="Service load, dealer network health, and the records that need a decision today."
      />

      <ServicePerformance role="internal" />

      <PipelineChart />

      <div className="grid gap-6 lg:grid-cols-2">
        <VolumeTrendChart />
        <CategoryBreakdownChart />
      </div>

      <DealerHealthChart />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttentionQueue />
        </div>
        <div className="space-y-6">
          <UncoveredBasePanel />
        </div>
      </div>

      <div className="pt-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Monthly review
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Structural signals worth checking monthly rather than daily.
        </p>
      </div>

      <BandThreePanel />

      <RecentActivity />
    </div>
  );
}
