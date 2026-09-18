export type DealerStatus = "active" | "inactive" | "pending";

export interface Dealer {
  id: string;
  name: string;
  status: DealerStatus;
  region: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  address: string;
  customerCount: number;
  equipmentCount: number;
  openServiceRequestCount: number;
  partnerSince: string;
  logoInitial?: string;
}
