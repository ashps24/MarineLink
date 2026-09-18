import { z } from "zod";

export const dealerStatusSchema = z.enum(["active", "inactive", "pending"]);

export const dealerSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: dealerStatusSchema,
  region: z.string(),
  primaryContactName: z.string(),
  primaryContactEmail: z.string().email(),
  primaryContactPhone: z.string(),
  address: z.string(),
  customerCount: z.number().int().nonnegative(),
  equipmentCount: z.number().int().nonnegative(),
  openServiceRequestCount: z.number().int().nonnegative(),
  partnerSince: z.string(),
  logoInitial: z.string().optional(),
});
