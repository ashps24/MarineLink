export type ServiceRequestStatus =
  | "new"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "closed";

export type ServiceRequestPriority = "low" | "medium" | "high" | "urgent";

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
}
