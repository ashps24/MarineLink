import { mockProductCategories, mockProducts } from "@/data/mock-products";
import { productCategorySchema, productSchema } from "@/schemas";
import type { Product, ProductCategory } from "@/types";

/**
 * The manufacturer's published product line. Unlike every other read in this
 * module, this is not scoped by role or organization — Marine Travelift's
 * catalogue is public information, the same for every viewer.
 */
export async function getProductCategories(): Promise<ProductCategory[]> {
  return mockProductCategories.map((c) => productCategorySchema.parse(c));
}

export async function getProducts(): Promise<Product[]> {
  return mockProducts.map((p) => productSchema.parse(p));
}
