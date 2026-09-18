"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductCategories, getProducts } from "@/lib/mock-api";
import { useMockKey } from "./use-query-keys";

export function useProductCategories() {
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["product-categories", mockKey],
    queryFn: getProductCategories,
  });
}

export function useProducts() {
  const mockKey = useMockKey();
  return useQuery({
    queryKey: ["products", mockKey],
    queryFn: getProducts,
  });
}
