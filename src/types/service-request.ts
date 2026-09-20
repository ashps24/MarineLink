export type ServiceRequestStatus =
  | "new"
  | "acknowledged"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "closed";

export type ServiceRequestPriority = "low" | "medium" | "high" | "urgent";

/**
 * Corrective work is a response to a fault; scheduled work is planned. Keeping
 * them apart matters for any "this machine keeps coming back" measure — an
 * annual inspection is not a repeat failure.
 */
export type ServiceRequestKind = "corrective" | "scheduled";

export interface ServiceRequest {
  id: string;
  referenceNumber: string;
  subject: string;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  assignedTeam: string;
  equipmentId?: string;
  customerId?: string;
  dealerId?: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
  kind: ServiceRequestKind;
  /**
   * Whether the yard reported the unit unusable when the request was raised.
   * A judgement made at intake, not a live machine state.
   */
  unitOutOfService: boolean;
  /** When the request reached its current status — the dwell clock. */
  statusChangedAt: string;
  /** Set once the request is resolved or closed. */
  resolvedAt?: string;
  /** Expected part arrival, where the dealer has one. Only for waiting work. */
  partsEtaDate?: string;
}
