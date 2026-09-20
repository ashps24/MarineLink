"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getServiceRequests,
  getServiceRequestById,
  serviceTeams,
  createServiceRequest,
  getServiceEvents,
  changeServiceRequestStatus,
  reassignServiceRequest,
  addServiceComment,
} from "@/lib/services";
import type { ServiceRequestFilters, NewServiceRequestInput } from "@/lib/services";
import type { ServiceRequest, ServiceRequestStatus } from "@/types";
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

export function useServiceEvents(requestId: string | undefined) {
  return useQuery({
    queryKey: ["service-events", requestId],
    queryFn: () => getServiceEvents(requestId as string),
    enabled: Boolean(requestId),
  });
}

/**
 * The three ways a request changes after it is raised. Each invalidates the
 * whole cache for the same reason a new request does: a status move shifts
 * the pipeline, the KPI tiles, the attention queue and the dealer's numbers,
 * none of which live in the query being mutated.
 */
export function useServiceRequestActions() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const settle = () => queryClient.invalidateQueries();

  const changeStatus = useMutation({
    mutationFn: ({
      request,
      toStatus,
      note,
    }: {
      request: ServiceRequest;
      toStatus: ServiceRequestStatus;
      note?: string;
    }) => changeServiceRequestStatus(user, request, toStatus, note),
    onSuccess: settle,
  });

  const reassign = useMutation({
    mutationFn: ({
      request,
      toTeam,
      note,
    }: {
      request: ServiceRequest;
      toTeam: string;
      note?: string;
    }) => reassignServiceRequest(user, request, toTeam, note),
    onSuccess: settle,
  });

  const comment = useMutation({
    mutationFn: ({ requestId, note }: { requestId: string; note: string }) =>
      addServiceComment(user, requestId, note),
    onSuccess: settle,
  });

  return { changeStatus, reassign, comment };
}
