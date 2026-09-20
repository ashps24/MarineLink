import { dashboardInsightSchema } from "@/schemas";
import type {
  DashboardInsight,
  DashboardSummary,
  ServiceRequest,
  ServiceRequestStatus,
} from "@/types";
import {
  visibleDealers,
  visibleCustomers,
  visibleEquipment,
  visibleServiceRequests,
} from "@/lib/permissions/visibility";
import { serviceStatusOrder } from "@/lib/constants/status";
import { hoursSince } from "@/lib/constants/time";
import { fetchLiveDealers, fetchLiveCustomers, fetchLiveEquipment, fetchLiveServiceRequests } from "./live-source";
import type { RequestScope } from "./types";

const OPEN_STATUSES: ServiceRequestStatus[] = ["new", "in_progress", "waiting"];

export function isOpenRequest(request: ServiceRequest): boolean {
  return OPEN_STATUSES.includes(request.status);
}

export async function getDashboardSummary(scope: RequestScope): Promise<DashboardSummary> {
  const [allRequests, allEquipment, allDealers, allCustomers] = await Promise.all([
    fetchLiveServiceRequests(),
    fetchLiveEquipment(),
    fetchLiveDealers(),
    fetchLiveCustomers(),
  ]);
  const requests = visibleServiceRequests(scope, allRequests);
  const equipment = visibleEquipment(scope, allEquipment);
  const dealers = visibleDealers(scope, allDealers);
  const customers = visibleCustomers(scope, allCustomers);

  return {
    openServiceRequests: requests.filter(isOpenRequest).length,
    highPriorityRequests: requests.filter(
      (request) =>
        isOpenRequest(request) && (request.priority === "high" || request.priority === "urgent"),
    ).length,
    activeDealers: dealers.filter((dealer) => dealer.status === "active").length,
    activeEquipment: equipment.filter((item) => item.currentStatus === "active").length,
    activeCustomers: customers.filter((customer) => customer.status === "active").length,
  };
}

/** Counts per service status, in a stable display order. */
export async function getServiceStatusBreakdown(
  scope: RequestScope,
): Promise<{ status: ServiceRequestStatus; count: number }[]> {
  const requests = visibleServiceRequests(scope, await fetchLiveServiceRequests());
  return serviceStatusOrder.map((status) => ({
    status,
    count: requests.filter((request) => request.status === status).length,
  }));
}

/**
 * The attention queue. Insights are derived from live records rather than
 * hand-written so they stay consistent with the records they point at.
 *
 * ── Future AI seam ───────────────────────────────────────────────────────
 * A later phase replaces this rule-based derivation with model-generated
 * management insights. Anything produced there is advisory and must stay
 * attributable to the record it came from, which is why every insight
 * carries an entityType/entityId pair.
 * ─────────────────────────────────────────────────────────────────────────
 */
export async function getDashboardInsights(scope: RequestScope): Promise<DashboardInsight[]> {
  const [allRequests, allEquipment, allDealers] = await Promise.all([
    fetchLiveServiceRequests(),
    fetchLiveEquipment(),
    fetchLiveDealers(),
  ]);
  const requests = visibleServiceRequests(scope, allRequests);
  const equipment = visibleEquipment(scope, allEquipment);
  const dealers = visibleDealers(scope, allDealers);
  const insights: DashboardInsight[] = [];

  for (const request of requests) {
    const hoursOld = hoursSince(request.createdAt);
    if (
      request.status === "new" &&
      (request.priority === "urgent" || request.priority === "high") &&
      hoursOld > 24
    ) {
      insights.push({
        id: `insight-unpicked-${request.id}`,
        title: `${request.referenceNumber} not yet picked up`,
        description: `${request.subject} has sat in "new" for ${Math.round(
          hoursOld / 24,
        )} day(s) with ${request.assignedTeam}.`,
        severity: request.priority === "urgent" ? "critical" : "attention",
        entityType: "service",
        entityId: request.id,
        actionLabel: "Review request",
      });
    }
  }

  for (const request of requests) {
    if (request.priority === "urgent" && isOpenRequest(request)) {
      insights.push({
        id: `insight-urgent-${request.id}`,
        title: request.subject,
        description: `${request.referenceNumber} is urgent and still open with ${request.assignedTeam}.`,
        severity: "critical",
        entityType: "service",
        entityId: request.id,
        actionLabel: "Review request",
      });
    }
  }

  for (const request of requests) {
    if (request.status === "waiting" && request.priority !== "urgent") {
      insights.push({
        id: `insight-waiting-${request.id}`,
        title: `Waiting on parts — ${request.referenceNumber}`,
        description: `${request.subject} has been waiting since ${new Date(
          request.updatedAt,
        ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`,
        severity: "attention",
        entityType: "service",
        entityId: request.id,
        actionLabel: "Review request",
      });
    }
  }

  for (const item of equipment) {
    if (item.currentStatus === "maintenance") {
      insights.push({
        id: `insight-equipment-${item.id}`,
        title: `${item.name} is in maintenance`,
        description: `${item.model} · serial ${item.serialNumber} is out of normal service.`,
        severity: "attention",
        entityType: "equipment",
        entityId: item.id,
        actionLabel: "View equipment",
      });
    }
  }

  if (scope.role === "internal") {
    for (const dealer of dealers) {
      if (dealer.status === "pending") {
        insights.push({
          id: `insight-dealer-${dealer.id}`,
          title: `${dealer.name} onboarding is pending`,
          description: `${dealer.region} dealer has ${dealer.customerCount} customers and is not yet fully active.`,
          severity: "info",
          entityType: "dealer",
          entityId: dealer.id,
          actionLabel: "View dealer",
        });
      }
    }
  }

  const severityRank = { critical: 0, attention: 1, info: 2 } as const;
  return insights
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
    .map((insight) => dashboardInsightSchema.parse(insight));
}

/** Most recently updated requests, for the "what changed" dashboard sections. */
export async function getRecentServiceActivity(
  scope: RequestScope,
  limit = 5,
): Promise<ServiceRequest[]> {
  const allRequests = await fetchLiveServiceRequests();
  return visibleServiceRequests(scope, allRequests)
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}
