"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardInsights,
  getDashboardSummary,
  getRecentServiceActivity,
  getServiceStatusBreakdown,
} from "@/lib/services";
import { useCurrentUser } from "./use-current-user";

export function useDashboardSummary() {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["dashboard-summary", scope],
    queryFn: () => getDashboardSummary(scope),
  });
}

export function useDashboardInsights() {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["dashboard-insights", scope],
    queryFn: () => getDashboardInsights(scope),
  });
}

export function useServiceStatusBreakdown() {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["service-status-breakdown", scope],
    queryFn: () => getServiceStatusBreakdown(scope),
  });
}

export function useRecentServiceActivity(limit = 5) {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["recent-service-activity", scope, limit],
    queryFn: () => getRecentServiceActivity(scope, limit),
  });
}
