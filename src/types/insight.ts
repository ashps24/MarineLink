export type InsightSeverity = "info" | "attention" | "critical";

export type InsightEntityType = "dealer" | "customer" | "equipment" | "service";

export interface DashboardInsight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  entityType: InsightEntityType;
  entityId: string;
  actionLabel: string;
}
