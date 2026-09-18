import { mockServiceRequests } from "@/data/mock-service-requests";
import { serviceRequestSchema } from "@/schemas";
import type { ServiceRequest } from "@/types";
import {
  visibleServiceRequests,
  canViewServiceRequest,
} from "@/lib/permissions/visibility";
import { mockRequest, matchesSearch } from "./client";
import type { RequestScope, ServiceRequestFilters } from "./types";

function byMostRecentUpdate(a: ServiceRequest, b: ServiceRequest): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export async function getServiceRequests(
  scope: RequestScope,
  filters: ServiceRequestFilters = {},
): Promise<ServiceRequest[]> {
  return mockRequest(() => {
    const rows = visibleServiceRequests(scope, mockServiceRequests)
      .filter((request) => {
        const statusOk =
          !filters.status || filters.status === "all" || request.status === filters.status;
        const priorityOk =
          !filters.priority || filters.priority === "all" || request.priority === filters.priority;
        const teamOk =
          !filters.assignedTeam ||
          filters.assignedTeam === "all" ||
          request.assignedTeam === filters.assignedTeam;
        const customerOk = !filters.customerId || request.customerId === filters.customerId;
        const dealerOk = !filters.dealerId || request.dealerId === filters.dealerId;
        const equipmentOk = !filters.equipmentId || request.equipmentId === filters.equipmentId;
        const searchOk = matchesSearch(
          filters.search,
          request.referenceNumber,
          request.subject,
          request.assignedTeam,
          request.summary,
        );
        return statusOk && priorityOk && teamOk && customerOk && dealerOk && equipmentOk && searchOk;
      })
      .sort(byMostRecentUpdate);

    return rows.map((row) => serviceRequestSchema.parse(row));
  }, []);
}

export async function getServiceRequestById(
  scope: RequestScope,
  id: string,
): Promise<ServiceRequest | null> {
  return mockRequest(() => {
    const request =
      mockServiceRequests.find((row) => row.id === id) ??
      mockServiceRequests.find((row) => row.referenceNumber === id);
    if (!request) return null;
    if (!canViewServiceRequest(scope, request)) return null;
    return serviceRequestSchema.parse(request);
  }, null);
}

export function serviceTeams(): string[] {
  return Array.from(new Set(mockServiceRequests.map((row) => row.assignedTeam))).sort();
}
