"use client";

import * as React from "react";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { ProductCard } from "./product-card";
import { ProductDetailDrawer } from "./product-detail-drawer";
import { CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { useProductCategories, useProducts } from "@/hooks/use-products";
import type { Product } from "@/types";

/**
 * Marine Travelift's published product line, grouped by the four ranges the
 * manufacturer sells. Names, model designations, rated capacities and
 * photography come from marinetravelift.com — nothing here is invented, and
 * nothing about pricing, lead time or availability is stated, since none of
 * that is public.
 */
export function ProductLineBrowser() {
  const { data: categories, isPending: categoriesPending, isError: categoriesError, refetch: refetchCategories } =
    useProductCategories();
  const { data: products, isPending: productsPending, isError: productsError, refetch: refetchProducts } =
    useProducts();

  const [selected, setSelected] = React.useState<Product | null>(null);

  const isPending = categoriesPending || productsPending;
  const isError = categoriesError || productsError;

  if (isPending) {
    return (
      <div className="space-y-8">
        {[0, 1].map((i) => (
          <CardGridSkeleton key={i} count={3} label="Loading the product line" />
        ))}
      </div>
    );
  }

  if (isError || !categories || !products) {
    return (
      <ErrorState
        title="Could not load the product line"
        description="The product catalogue service did not respond."
        onRetry={() => {
          refetchCategories();
          refetchProducts();
        }}
      />
    );
  }

  const selectedCategory = selected
    ? categories.find((c) => c.id === selected.categoryId)
    : undefined;

  return (
    <div className="space-y-10">
      {categories.map((category) => {
        const items = products.filter((p) => p.categoryId === category.id);
        return (
          <section key={category.id} aria-labelledby={`category-${category.id}`}>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2
                  id={`category-${category.id}`}
                  className="font-heading text-lg font-semibold tracking-tight text-foreground"
                >
                  {category.name}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{category.tagline}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {category.capacityRange} · {category.vesselRange}
                </p>
              </div>
              <a
                href={category.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-ocean hover:underline"
              >
                marinetravelift.com
                <ArrowSquareOut size={12} aria-hidden="true" />
              </a>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {items.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  onSelect={() => setSelected(product)}
                />
              ))}
            </div>
          </section>
        );
      })}

      <ProductDetailDrawer
        product={selected}
        category={selectedCategory}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
