"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardInsights,
  getDashboardSummary,
  getRecentServiceActivity,
  getServiceStatusBreakdown,
} from "@/lib/mock-api";
import { useCurrentUser } from "./use-current-user";
import { useMockKey } from "./use-query-keys";

export function useDashboardSummary() {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["dashboard-summary", scope, mockKey],
    queryFn: () => getDashboardSummary(scope),
  });
}

export function useDashboardInsights() {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["dashboard-insights", scope, mockKey],
    queryFn: () => getDashboardInsights(scope),
  });
}

export function useServiceStatusBreakdown() {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["service-status-breakdown", scope, mockKey],
    queryFn: () => getServiceStatusBreakdown(scope),
  });
}

export function useRecentServiceActivity(limit = 5) {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["recent-service-activity", scope, limit, mockKey],
    queryFn: () => getRecentServiceActivity(scope, limit),
  });
}
