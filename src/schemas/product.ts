import { z } from "zod";

export const productCategoryIdSchema = z.enum([
  "boat-hoists-25-100",
  "boat-hoists-150-1500",
  "marine-forklifts",
  "hydraulic-transporters",
]);

export const productCategorySchema = z.object({
  id: productCategoryIdSchema,
  name: z.string(),
  shortName: z.string(),
  tagline: z.string(),
  description: z.string(),
  vesselRange: z.string(),
  capacityRange: z.string(),
  features: z.array(z.string()),
  options: z.array(z.string()),
  sourceUrl: z.string(),
});

export const productSchema = z.object({
  id: z.string(),
  categoryId: productCategoryIdSchema,
  name: z.string(),
  model: z.string(),
  capacityLbs: z.number(),
  capacityKg: z.number(),
  capacityTons: z.number(),
  summary: z.string(),
  wheelbaseOptions: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
});
