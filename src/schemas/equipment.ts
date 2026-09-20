import { z } from "zod";

export const equipmentStatusSchema = z.enum([
  "active",
  "maintenance",
  "inactive",
  "retired",
]);

export const equipmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  equipmentType: z.string(),
  productId: z.string(),
  model: z.string(),
  serialNumber: z.string(),
  currentStatus: equipmentStatusSchema,
  customerId: z.string().optional(),
  dealerId: z.string().optional(),
  liftCapacityTons: z.number().positive().optional(),
  commissionedDate: z.string().optional(),
  location: z.string().optional(),
  imageUrl: z.string().optional(),
  lastInspectionDate: z.string().optional(),
  serviceContractStatus: z.enum(["active", "expired", "none"]),
  serviceContractExpiresOn: z.string().optional(),
});
