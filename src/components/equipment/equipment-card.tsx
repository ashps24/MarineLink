"use client";

import Link from "next/link";
import { MapPin, Barcode } from "@phosphor-icons/react/dist/ssr";
import { motion, useReducedMotion } from "framer-motion";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Equipment } from "@/types";
import { cn } from "@/lib/utils";

export function EquipmentCard({
  item,
  index = 0,
  className,
}: {
  item: Equipment;
  index?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: reduceMotion ? 0 : Math.min(index, 8) * 0.04 }}
      className={className}
    >
      <Link
        href={`/equipment/${item.id}`}
        className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-ocean/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {item.equipmentType}
            </p>
            <h3 className="mt-1 line-clamp-2 font-heading text-[0.9375rem] leading-snug font-semibold text-balance text-foreground">
              {item.name}
            </h3>
          </div>
          <StatusBadge kind="equipment" status={item.currentStatus} />
        </div>

        <dl className="mt-4 space-y-1.5 text-sm">
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

        {item.location ? (
          <p className="mt-4 flex items-center gap-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
            <MapPin size={13} aria-hidden="true" className={cn("shrink-0")} />
            <span className="truncate">{item.location}</span>
          </p>
        ) : null}
      </Link>
    </motion.div>
  );
}
