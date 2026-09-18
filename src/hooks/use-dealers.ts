"use client";

import { useQuery } from "@tanstack/react-query";
import { getDealers, getDealerById } from "@/lib/mock-api";
import type { DealerFilters } from "@/lib/mock-api";
import { useCurrentUser } from "./use-current-user";
import { useMockKey } from "./use-query-keys";

export function useDealers(filters: DealerFilters = {}) {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["dealers", scope, filters, mockKey],
    queryFn: () => getDealers(scope, filters),
  });
}

export function useDealer(dealerId: string | undefined) {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["dealer", scope, dealerId, mockKey],
    queryFn: () => getDealerById(scope, dealerId as string),
    enabled: Boolean(dealerId),
  });
}
