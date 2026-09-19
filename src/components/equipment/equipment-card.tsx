"use client";

import Link from "next/link";
import { MapPin, Barcode } from "@phosphor-icons/react/dist/ssr";
import { motion, useReducedMotion } from "framer-motion";
import { StatusBadge } from "@/components/shared/status-badge";
import { EquipmentImage } from "./equipment-image";
import type { Equipment } from "@/types";
import { cn } from "@/lib/utils";

export function EquipmentCard({
  item,
  index = 0,
  className,
  context,
}: {
  item: Equipment;
  index?: number;
  className?: string;
  /** Owner/dealer line — shown to roles allowed to see the other side of the relationship. */
  context?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: reduceMotion ? 0 : Math.min(index, 8) * 0.04 }}
      className={className}
    >
      <Link prefetch={false}
        href={`/equipment/${item.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-ocean/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div className="relative">
          <EquipmentImage
            item={item}
            width={640}
            sizes="(min-width: 1280px) 22rem, (min-width: 640px) 45vw, 92vw"
            className="aspect-[16/9] w-full transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <span className="absolute top-3 right-3">
            <StatusBadge kind="equipment" status={item.currentStatus} onMedia />
          </span>
          <span className="absolute bottom-3 left-4 text-[0.6875rem] font-medium tracking-wide text-white/90 uppercase drop-shadow-sm">
            {item.equipmentType}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 font-heading text-[0.9375rem] leading-snug font-semibold text-balance text-foreground">
            {item.name}
          </h3>

          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex items-baseline gap-2">
              <dt className="text-xs text-muted-foreground">Model</dt>
              <dd className="font-medium text-foreground">{item.model}</dd>
              {item.liftCapacityTons ? (
                <dd className="ml-auto text-xs tabular-nums text-muted-foreground">
                  {item.liftCapacityTons} ton
                </dd>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Barcode size={13} aria-hidden="true" className="shrink-0" />
              <span className="truncate font-mono tracking-tight">{item.serialNumber}</span>
            </div>
          </dl>

          {item.location || context ? (
            <div className="mt-4 space-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
              {context ? (
                <p className="truncate font-medium text-foreground/80">{context}</p>
              ) : null}
              {item.location ? (
                <p className="flex items-center gap-1.5">
                  <MapPin size={13} aria-hidden="true" className={cn("shrink-0")} />
                  <span className="truncate">{item.location}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}
