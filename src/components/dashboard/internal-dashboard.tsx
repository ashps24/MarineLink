"use client";

import { Info } from "@phosphor-icons/react/dist/ssr";
import { DashboardGreeting } from "./dashboard-greeting";
import { AttentionQueue } from "./attention-queue";
import { ServiceStatusSummary } from "./service-status-summary";
import { RecentActivity } from "./recent-activity";
import { BandOneKpis } from "./executive/band-one-kpis";
import { DealerLoadPanel, UncoveredBasePanel } from "./executive/band-two-panel";
import { BandThreePanel } from "./executive/band-three-panel";
import type { User } from "@/types";

/**
 * Leadership view, in three bands.
 *
 * Band 1 answers "is anything stopped right now, and are we keeping up?" in
 * five tiles. Band 2 turns those numbers into named dealers and accounts —
 * who to call. Band 3 is monthly-review material, placed below the fold on
 * purpose because none of it changes hour to hour.
 */
export function InternalDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <DashboardGreeting
        user={user}
        description="Service load, dealer network health, and the records that need a decision today."
      />

      <p className="-mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info size={12} aria-hidden="true" className="shrink-0" />
        Trend metrics below include a year of generated demonstration history behind the
        current requests, not live records.
      </p>

      <BandOneKpis />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttentionQueue />
        </div>
        <div className="space-y-6">
          <DealerLoadPanel />
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

      <div className="grid gap-6 lg:grid-cols-2">
        <ServiceStatusSummary />
        <RecentActivity />
      </div>
    </div>
  );
}
