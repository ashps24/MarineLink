import { serviceRequestSchema } from "@/schemas";
import type { ServiceRequest } from "@/types";
import {
  visibleServiceRequests,
  canViewServiceRequest,
  visibleEquipment,
} from "@/lib/permissions/visibility";
import { apiClient } from "@/lib/api/client";
import { fetchLiveServiceRequests, fetchLiveEquipment, invalidateLiveCache } from "./live-source";
import { matchesSearch } from "./client";
import type { RequestScope, ServiceRequestFilters } from "./types";

function byMostRecentUpdate(a: ServiceRequest, b: ServiceRequest): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export async function getServiceRequests(
  scope: RequestScope,
  filters: ServiceRequestFilters = {},
): Promise<ServiceRequest[]> {
  const allRequests = await fetchLiveServiceRequests();
  const rows = visibleServiceRequests(scope, allRequests)
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
}

export async function getServiceRequestById(
  scope: RequestScope,
  id: string,
): Promise<ServiceRequest | null> {
  const allRequests = await fetchLiveServiceRequests();
  const request =
    allRequests.find((row) => row.id === id) ??
    allRequests.find((row) => row.referenceNumber === id);
  if (!request) return null;
  if (!canViewServiceRequest(scope, request)) return null;
  return serviceRequestSchema.parse(request);
}

export async function serviceTeams(): Promise<string[]> {
  const allRequests = await fetchLiveServiceRequests();
  return Array.from(new Set(allRequests.map((row) => row.assignedTeam))).sort();
}

export interface NewServiceRequestInput {
  equipmentId: string;
  subject: string;
  summary: string;
  priority: ServiceRequest["priority"];
  kind: ServiceRequest["kind"];
  unitOutOfService: boolean;
}

/**
 * The next reference in the house SR-<year>-<sequence> format, continuing the
 * highest sequence already on record rather than restarting per year — the
 * sequence is what makes a reference unique, and reusing one would make two
 * different requests indistinguishable to anyone reading a ticket number.
 */
function nextReferenceNumber(existing: ServiceRequest[]): string {
  const highest = existing.reduce((max, request) => {
    const sequence = Number(request.referenceNumber.split("-").pop());
    return Number.isFinite(sequence) && sequence > max ? sequence : max;
  }, 0);
  return `SR-${new Date().getFullYear()}-${String(highest + 1).padStart(4, "0")}`;
}

/**
 * Raises a request against a unit the caller can actually see. The customer
 * and dealer are taken from the equipment record rather than from the form,
 * so a request can never be filed against someone else's account.
 */
export async function createServiceRequest(
  scope: RequestScope,
  input: NewServiceRequestInput,
): Promise<ServiceRequest> {
  const [allEquipment, allRequests] = await Promise.all([
    fetchLiveEquipment(),
    fetchLiveServiceRequests(),
  ]);

  const unit = visibleEquipment(scope, allEquipment).find((item) => item.id === input.equipmentId);
  if (!unit) throw new Error("That unit is not available on your account.");

  const dealerTeam = allRequests.find((request) => request.dealerId === unit.dealerId)?.assignedTeam;
  const now = new Date().toISOString();

  const created = await apiClient.create<Record<string, unknown>>("service-requests", {
    referenceNumber: nextReferenceNumber(allRequests),
    subject: input.subject,
    status: "new",
    priority: input.priority,
    assignedTeam: dealerTeam ?? "Unassigned",
    equipmentId: unit.id,
    customerId: unit.customerId,
    dealerId: unit.dealerId,
    summary: input.summary,
    kind: input.kind,
    unitOutOfService: input.unitOutOfService,
    statusChangedAt: now,
  });

  invalidateLiveCache();
  return serviceRequestSchema.parse(
    Object.fromEntries(Object.entries(created).filter(([, value]) => value !== null)),
  );
}
