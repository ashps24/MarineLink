export type ProductCategoryId =
  | "boat-hoists-25-100"
  | "boat-hoists-150-1500"
  | "marine-forklifts"
  | "hydraulic-transporters";

export interface ProductCategory {
  id: ProductCategoryId;
  name: string;
  shortName: string;
  /** One line describing what the range is for. */
  tagline: string;
  description: string;
  /** Vessel lengths the range is built to handle, in plain language. */
  vesselRange: string;
  capacityRange: string;
  /** Standard equipment across the range. */
  features: string[];
  /** Available options, as named on the product line. */
  options: string[];
  /** The manufacturer page these specifications come from. */
  sourceUrl: string;
}

export interface Product {
  id: string;
  categoryId: ProductCategoryId;
  name: string;
  /** Model designation as Marine Travelift lists it. */
  model: string;
  capacityLbs: number;
  capacityKg: number;
  /** Metric tons, for sorting and for matching against fielded equipment. */
  capacityTons: number;
  summary: string;
  /** Forklifts only — available wheelbase options, in inches. */
  wheelbaseOptions?: string[];
  imageUrl?: string;
}
