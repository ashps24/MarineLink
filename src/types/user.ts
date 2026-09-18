export type UserRole = "internal" | "dealer" | "customer";

export type DashboardType = "internal" | "dealer" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  avatarUrl?: string;
  permissions: string[];
  dashboardType: DashboardType;
  title?: string;
}
