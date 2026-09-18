export * from "./user";
export * from "./dealer";
export * from "./customer";
export * from "./equipment";
export * from "./service-request";
export * from "./insight";

export interface DashboardSummary {
  openServiceRequests: number;
  highPriorityRequests: number;
  activeDealers: number;
  activeEquipment: number;
  activeCustomers?: number;
}
