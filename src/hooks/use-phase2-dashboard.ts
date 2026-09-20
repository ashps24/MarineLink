"use client";

import { useQuery } from "@tanstack/react-query";
import { getPhase2Dashboard } from "@/lib/services";
import type { ComparisonPeriod } from "@/lib/services";
import { useCurrentUser } from "./use-current-user";

export function usePhase2Dashboard(period: ComparisonPeriod = "month") {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["phase2-dashboard", scope, period],
    queryFn: () => getPhase2Dashboard(scope, period),
  });
}
