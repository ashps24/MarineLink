"use client";

import { InternalDashboard } from "@/components/dashboard/internal-dashboard";
import { DealerDashboard } from "@/components/dashboard/dealer-dashboard";
import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";
import { useCurrentUser } from "@/hooks/use-current-user";

/**
 * The landing view renders here directly rather than redirecting to
 * /dashboard. Slate replays deep links through "/", so a redirect on the root
 * route would fire before the replay runs and strand every deep link.
 */
export default function DashboardPage() {
  const { user } = useCurrentUser();

  if (user.dashboardType === "dealer") return <DealerDashboard user={user} />;
  if (user.dashboardType === "customer") return <CustomerDashboard user={user} />;
  return <InternalDashboard user={user} />;
}
