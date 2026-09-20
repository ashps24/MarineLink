"use client";

import { ClipboardText, Timer, Buildings, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { KpiTile } from "@/components/shared/kpi-tile";
import { MetricsSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { usePhase2Dashboard } from "@/hooks/use-phase2-dashboard";
import type { UserRole } from "@/types";

/**
 * The four headline KPIs from the Phase 2 dashboard brief: open requests with
 * a 30-day trend, average time to resolution, active dealer/customer
 * accounts, and equipment under an active service contract.
 */
export function Phase2KpiRow({ role }: { role: UserRole }) {
  const { data, isPending, isError, refetch } = usePhase2Dashboard();

  if (isPending) return <MetricsSkeleton count={4} />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Could not load dashboard metrics"
        description="The dashboard service did not respond."
        onRetry={() => refetch()}
      />
    );
  }

  const { openRequests, resolutionTime, activeAccounts, contractedEquipment } = data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile
        index={0}
        label="Open service requests"
        value={openRequests.count}
        icon={ClipboardText}
        emphasis={openRequests.change > 0 ? "critical" : "default"}
        comparison={{
          label: `${openRequests.change > 0 ? "+" : ""}${openRequests.change} vs 30 days ago`,
          direction: openRequests.change > 0 ? "up" : openRequests.change < 0 ? "down" : "flat",
          sentiment: openRequests.change > 0 ? "bad" : openRequests.change < 0 ? "good" : "neutral",
        }}
        href="/service"
      />

      <KpiTile
        index={1}
        label="Time to resolution"
        value={
          resolutionTime.averageDays !== null ? Math.round(resolutionTime.averageDays) : "—"
        }
        unit={resolutionTime.averageDays !== null ? "days avg" : undefined}
        icon={Timer}
        insufficientData={
          resolutionTime.averageDays === null
            ? `Fewer than 8 closures in the last 90 days (n=${resolutionTime.n})`
            : undefined
        }
        caption={
          resolutionTime.medianDays !== null
            ? `Median ${Math.round(resolutionTime.medianDays)}d · n=${resolutionTime.n}, last 90 days`
            : undefined
        }
      />

      {role === "internal" ? (
        <KpiTile
          index={2}
          label="Active accounts"
          value={`${activeAccounts.activeDealers} / ${activeAccounts.activeCustomers}`}
          icon={Buildings}
          caption={`Dealers / customers, of ${activeAccounts.totalDealers} + ${activeAccounts.totalCustomers} on record`}
          href="/dealers"
        />
      ) : null}

      <KpiTile
        index={3}
        label="Under active contract"
        value={contractedEquipment.activeCount}
        unit={`/ ${contractedEquipment.fieldedTotal} units`}
        icon={ShieldCheck}
        emphasis={contractedEquipment.expiredCount > 0 ? "critical" : "default"}
        comparison={
          contractedEquipment.expiredCount > 0
            ? {
                label: `${contractedEquipment.expiredCount} contract${contractedEquipment.expiredCount === 1 ? "" : "s"} expired`,
                direction: "flat",
                sentiment: "bad",
              }
            : undefined
        }
        href="/equipment"
      />
    </div>
  );
}
