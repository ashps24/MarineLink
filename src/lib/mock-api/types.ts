import type {
  CustomerStatus,
  DealerStatus,
  EquipmentStatus,
  ServiceRequestPriority,
  ServiceRequestStatus,
  User,
} from "@/types";

/**
 * The scope a request is made under. A real backend derives this from the
 * session; here it is passed explicitly so the mock layer can apply the same
 * visibility rules the server will eventually own.
 */
export type RequestScope = Pick<User, "role" | "organizationId">;

export interface DealerFilters {
  search?: string;
  status?: DealerStatus | "all";
  region?: string | "all";
}

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatus | "all";
  dealerId?: string | "all";
}

export interface EquipmentFilters {
  search?: string;
  equipmentType?: string | "all";
  status?: EquipmentStatus | "all";
  customerId?: string;
  dealerId?: string;
}

export interface ServiceRequestFilters {
  search?: string;
  status?: ServiceRequestStatus | "all";
  priority?: ServiceRequestPriority | "all";
  assignedTeam?: string | "all";
  customerId?: string;
  dealerId?: string;
  equipmentId?: string;
}
