"use client";

import Image from "next/image";
import { ArrowSquareOut, Check } from "@phosphor-icons/react/dist/ssr";
import { ResponsiveDrawer } from "@/components/shared/responsive-drawer";
import { KeyValueList } from "@/components/shared/key-value-list";
import type { Product, ProductCategory } from "@/types";

function imgSrc(url: string, width: number): string {
  return `${url}?auto=format&fit=crop&w=${width}&q=70`;
}

/**
 * Full specification for one catalogue product, in a drawer rather than a
 * route — this is reference material a viewer checks and closes, not a
 * destination they navigate to and back from.
 */
export function ProductDetailDrawer({
  product,
  category,
  open,
  onOpenChange,
}: {
  product: Product | null;
  category: ProductCategory | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!product || !category) return null;

  return (
    <ResponsiveDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={product.name}
      description={`${category.shortName} · Model ${product.model}`}
    >
      <div className="space-y-5 py-2">
        {product.imageUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted">
            <Image
              src={imgSrc(product.imageUrl, 800)}
              alt={product.name}
              fill
              sizes="(min-width: 768px) 32rem, 92vw"
              className="object-cover"
            />
          </div>
        ) : null}

        <KeyValueList
          columns={2}
          entries={[
            { label: "Model", value: product.model, mono: true },
            {
              label: "Rated capacity",
              value: `${product.capacityLbs.toLocaleString("en-US")} lbs / ${product.capacityKg.toLocaleString("en-US")} kg`,
            },
            ...(product.wheelbaseOptions
              ? [{ label: "Wheelbase options", value: product.wheelbaseOptions.join(", ") }]
              : []),
            { label: "Vessel range", value: category.vesselRange },
          ]}
        />

        <p className="text-sm leading-relaxed text-muted-foreground">{product.summary}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Standard features
            </p>
            <ul className="mt-2 space-y-1.5">
              {category.features.slice(0, 6).map((feature) => (
                <li key={feature} className="flex items-start gap-1.5 text-sm text-foreground">
                  <Check size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Available options
            </p>
            <ul className="mt-2 space-y-1.5">
              {category.options.slice(0, 6).map((option) => (
                <li key={option} className="text-sm text-muted-foreground">
                  {option}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <a
          href={category.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ocean hover:underline"
        >
          View on marinetravelift.com
          <ArrowSquareOut size={14} aria-hidden="true" />
        </a>
      </div>
    </ResponsiveDrawer>
  );
}
