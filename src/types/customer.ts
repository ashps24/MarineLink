export type CustomerStatus = "active" | "inactive" | "prospect";

export interface Customer {
  id: string;
  name: string;
  status: CustomerStatus;
  organizationName?: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  address: string;
  dealerId?: string;
  equipmentCount: number;
  openServiceRequestCount: number;
  customerSince: string;
}
