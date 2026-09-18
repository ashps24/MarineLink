import type {
  DealerStatus,
  CustomerStatus,
  EquipmentStatus,
  ServiceRequestStatus,
  ServiceRequestPriority,
} from "@/types";

export type SemanticTone = "neutral" | "info" | "success" | "warning" | "danger";

export const dealerStatusConfig: Record<DealerStatus, { label: string; tone: SemanticTone }> = {
  active: { label: "Active", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  inactive: { label: "Inactive", tone: "neutral" },
};

export const customerStatusConfig: Record<CustomerStatus, { label: string; tone: SemanticTone }> = {
  active: { label: "Active", tone: "success" },
  prospect: { label: "Prospect", tone: "info" },
  inactive: { label: "Inactive", tone: "neutral" },
};

export const equipmentStatusConfig: Record<EquipmentStatus, { label: string; tone: SemanticTone }> = {
  active: { label: "Active", tone: "success" },
  maintenance: { label: "In Maintenance", tone: "warning" },
  inactive: { label: "Inactive", tone: "neutral" },
  retired: { label: "Retired", tone: "danger" },
};

export const serviceStatusConfig: Record<ServiceRequestStatus, { label: string; tone: SemanticTone }> = {
  new: { label: "New", tone: "info" },
  in_progress: { label: "In Progress", tone: "info" },
  waiting: { label: "Waiting on Parts", tone: "warning" },
  resolved: { label: "Resolved", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};

export const servicePriorityConfig: Record<ServiceRequestPriority, { label: string; tone: SemanticTone }> = {
  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "info" },
  high: { label: "High", tone: "warning" },
  urgent: { label: "Urgent", tone: "danger" },
};

export const serviceStatusOrder: ServiceRequestStatus[] = [
  "new",
  "in_progress",
  "waiting",
  "resolved",
  "closed",
];
