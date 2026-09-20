"use client";

import { useQuery } from "@tanstack/react-query";
import { getDealers, getDealerById, dealerRegions } from "@/lib/mock-api";
import type { DealerFilters } from "@/lib/mock-api";
import { useCurrentUser } from "./use-current-user";

export function useDealers(filters: DealerFilters = {}) {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["dealers", scope, filters],
    queryFn: () => getDealers(scope, filters),
  });
}

export function useDealer(dealerId: string | undefined) {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["dealer", scope, dealerId],
    queryFn: () => getDealerById(scope, dealerId as string),
    enabled: Boolean(dealerId),
  });
}

export function useDealerRegions() {
  return useQuery({
    queryKey: ["dealer-regions"],
    queryFn: dealerRegions,
  });
}
