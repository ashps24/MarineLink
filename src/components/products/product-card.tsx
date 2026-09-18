"use client";

import Image from "next/image";
import { Barcode } from "@phosphor-icons/react/dist/ssr";
import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@/types";

function imgSrc(url: string, width: number): string {
  return `${url}?auto=format&fit=crop&w=${width}&q=70`;
}

export function ProductCard({
  product,
  onSelect,
  index = 0,
}: {
  product: Product;
  onSelect: () => void;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: reduceMotion ? 0 : Math.min(index, 8) * 0.03 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:border-ocean/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image
            src={imgSrc(product.imageUrl, 480)}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 18rem, (min-width: 640px) 45vw, 92vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="font-heading text-sm font-semibold text-foreground">{product.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Barcode size={12} aria-hidden="true" />
          {product.model}
        </p>
        <p className="mt-2 text-xs font-medium text-ocean">
          {product.capacityLbs.toLocaleString("en-US")} lbs
          {product.wheelbaseOptions ? ` · ${product.wheelbaseOptions.length} wheelbase options` : ""}
        </p>
      </div>
    </motion.button>
  );
}
