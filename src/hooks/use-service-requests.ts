"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getServiceRequests,
  getServiceRequestById,
  serviceTeams,
  createServiceRequest,
} from "@/lib/mock-api";
import type { ServiceRequestFilters, NewServiceRequestInput } from "@/lib/mock-api";
import { useCurrentUser } from "./use-current-user";

export function useServiceRequests(filters: ServiceRequestFilters = {}) {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["service-requests", scope, filters],
    queryFn: () => getServiceRequests(scope, filters),
  });
}

export function useServiceRequest(requestId: string | undefined) {
  const { scope } = useCurrentUser();
  return useQuery({
    queryKey: ["service-request", scope, requestId],
    queryFn: () => getServiceRequestById(scope, requestId as string),
    enabled: Boolean(requestId),
  });
}

export function useServiceTeams() {
  return useQuery({
    queryKey: ["service-teams"],
    queryFn: serviceTeams,
  });
}

/**
 * Raising a request changes counts on the dashboard, the dealer, the customer
 * and the unit, so the whole cache is invalidated rather than one list — the
 * alternative is a screen that shows the new request but a tile that still
 * says there are none.
 */
export function useCreateServiceRequest() {
  const { scope } = useCurrentUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewServiceRequestInput) => createServiceRequest(scope, input),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
