import { z } from "zod";

export const insightSeveritySchema = z.enum(["info", "attention", "critical"]);
export const insightEntityTypeSchema = z.enum([
  "dealer",
  "customer",
  "equipment",
  "service",
]);

export const dashboardInsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: insightSeveritySchema,
  entityType: insightEntityTypeSchema,
  entityId: z.string(),
  actionLabel: z.string(),
});
