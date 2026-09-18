"use client";

import { useQuery } from "@tanstack/react-query";
import { getServiceRequests, getServiceRequestById } from "@/lib/mock-api";
import type { ServiceRequestFilters } from "@/lib/mock-api";
import { useCurrentUser } from "./use-current-user";
import { useMockKey } from "./use-query-keys";

export function useServiceRequests(filters: ServiceRequestFilters = {}) {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["service-requests", scope, filters, mockKey],
    queryFn: () => getServiceRequests(scope, filters),
  });
}

export function useServiceRequest(requestId: string | undefined) {
  const { scope } = useCurrentUser();
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["service-request", scope, requestId, mockKey],
    queryFn: () => getServiceRequestById(scope, requestId as string),
    enabled: Boolean(requestId),
  });
}
