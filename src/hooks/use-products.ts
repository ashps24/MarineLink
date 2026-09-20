"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductCategories, getProducts } from "@/lib/services";

export function useProductCategories() {
  return useQuery({
    queryKey: ["product-categories"],
    queryFn: getProductCategories,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });
}
