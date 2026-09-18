"use client";

import * as React from "react";
import Image from "next/image";
import { Wrench, Boat, Truck, Crane } from "@phosphor-icons/react/dist/ssr";
import type { Equipment } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Photography is stored as a bare Unsplash URL so one record can serve several
 * sizes. Sizing parameters are appended here rather than baked into the fixture.
 */
export function equipmentImageSrc(url: string, width: number): string {
  return `${url}?auto=format&fit=crop&w=${width}&q=70`;
}

function iconForType(equipmentType: string) {
  if (/hoist|lift/i.test(equipmentType)) return Crane;
  if (/trailer/i.test(equipmentType)) return Truck;
  if (/forklift/i.test(equipmentType)) return Wrench;
  return Boat;
}

/**
 * Equipment photography with a designed fallback.
 *
 * The image sits on top of an illustrated placeholder rather than replacing it,
 * so a URL that stops resolving degrades to a marine-tinted panel with the
 * right icon instead of an empty box. The container owns the aspect ratio, so
 * nothing reflows as the photo arrives.
 */
export function EquipmentImage({
  item,
  width,
  sizes,
  className,
  priority = false,
  rounded = "rounded-t-2xl",
}: {
  item: Equipment;
  width: number;
  sizes: string;
  className?: string;
  priority?: boolean;
  rounded?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const TypeIcon = iconForType(item.equipmentType);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-gradient-to-br from-primary/85 via-primary/70 to-ocean/60",
        rounded,
        className,
      )}
    >
      {/* Fallback layer — always painted, revealed if the photo cannot load. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center text-white/45"
      >
        <TypeIcon size={40} weight="light" />
      </span>

      {item.imageUrl && !failed ? (
        <Image
          src={equipmentImageSrc(item.imageUrl, width)}
          alt={`${item.equipmentType} similar to ${item.name}`}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : null}

      {/* Keeps white status badges and text legible over any photograph. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-primary/55 via-primary/10 to-transparent"
      />
    </div>
  );
}
