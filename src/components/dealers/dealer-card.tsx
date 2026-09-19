"use client";

import Link from "next/link";
import { MapPin, UsersThree, Wrench, ClipboardText } from "@phosphor-icons/react/dist/ssr";
import { motion, useReducedMotion } from "framer-motion";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Dealer } from "@/types";

function Stat({
  icon: IconComponent,
  value,
  label,
}: {
  icon: typeof UsersThree;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <IconComponent size={14} aria-hidden="true" className="text-muted-foreground" />
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function DealerCard({ dealer, index = 0 }: { dealer: Dealer; index?: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: reduceMotion ? 0 : Math.min(index, 8) * 0.04 }}
    >
      <Link prefetch={false}
        href={`/dealers/${dealer.id}`}
        className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-ocean/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div className="flex items-start gap-3">
          <EntityAvatar name={dealer.name} />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-heading text-[0.9375rem] leading-snug font-semibold text-balance text-foreground">
              {dealer.name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} aria-hidden="true" />
              {dealer.region}
            </p>
          </div>
          <StatusBadge kind="dealer" status={dealer.status} />
        </div>

        <p className="mt-4 truncate text-sm text-muted-foreground">
          {dealer.primaryContactName}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4">
          <Stat icon={UsersThree} value={dealer.customerCount} label="customers" />
          <Stat icon={Wrench} value={dealer.equipmentCount} label="units" />
          <Stat icon={ClipboardText} value={dealer.openServiceRequestCount} label="open" />
        </div>
      </Link>
    </motion.div>
  );
}
