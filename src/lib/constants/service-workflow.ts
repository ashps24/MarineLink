import type { ServiceRequestStatus, ServiceRequestPriority, UserRole } from "@/types";

/**
 * House resolution targets, in hours from when a request is raised.
 *
 * These are stated operating commitments, not a field on the record — no SLA
 * is stored per request. Anything that reports compliance against them has to
 * show the target alongside the figure, so a reader can see what the number is
 * measured against rather than taking an unexplained percentage on trust.
 */
export const RESOLUTION_TARGET_HOURS: Record<ServiceRequestPriority, number> = {
  urgent: 24,
  high: 48,
  medium: 120,
  low: 240,
};

export function resolutionTargetLabel(priority: ServiceRequestPriority): string {
  const hours = RESOLUTION_TARGET_HOURS[priority];
  return hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}

/** Statuses that still represent work in the queue. */
export const OPEN_STATUSES: ServiceRequestStatus[] = [
  "new",
  "acknowledged",
  "in_progress",
  "waiting",
];

export const CLOSED_STATUSES: ServiceRequestStatus[] = ["resolved", "closed"];

export function isOpenStatus(status: ServiceRequestStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

/**
 * Where a request may go next.
 *
 * Work does not always move forward — parts arrive, a fix does not hold — so
 * the graph deliberately allows stepping back rather than only advancing.
 */
const TRANSITIONS: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  new: ["acknowledged", "in_progress", "closed"],
  acknowledged: ["in_progress", "waiting", "closed"],
  in_progress: ["waiting", "resolved", "acknowledged"],
  waiting: ["in_progress", "resolved"],
  resolved: ["closed", "in_progress"],
  closed: ["in_progress"],
};

/**
 * Who may move a request, and where to.
 *
 * Internal staff and the dealer working the request drive it through the
 * pipeline. A customer does not run the queue, but they are the one who knows
 * whether the fix actually held — so they may close out work reported as
 * resolved, or send it back if it did not.
 */
export function allowedNextStatuses(
  role: UserRole,
  current: ServiceRequestStatus,
): ServiceRequestStatus[] {
  const next = TRANSITIONS[current] ?? [];
  if (role === "internal" || role === "dealer") return next;

  if (current === "resolved") return next.filter((s) => s === "closed" || s === "in_progress");
  return [];
}

export function canReassign(role: UserRole): boolean {
  return role === "internal" || role === "dealer";
}

/** How a customer's two permitted moves should read on a button. */
export const CUSTOMER_ACTION_LABELS: Partial<Record<ServiceRequestStatus, string>> = {
  closed: "Confirm resolved",
  in_progress: "Reopen — not fixed",
};
