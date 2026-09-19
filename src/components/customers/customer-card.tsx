"use client";

import Link from "next/link";
import { Buildings, Wrench, ClipboardText } from "@phosphor-icons/react/dist/ssr";
import { motion, useReducedMotion } from "framer-motion";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Customer, Dealer } from "@/types";

export function CustomerCard({
  customer,
  dealer,
  index = 0,
}: {
  customer: Customer;
  dealer?: Dealer;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: reduceMotion ? 0 : Math.min(index, 8) * 0.04 }}
    >
      <Link prefetch={false}
        href={`/customers/${customer.id}`}
        className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-ocean/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div className="flex items-start gap-3">
          <EntityAvatar name={customer.name} />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-heading text-[0.9375rem] leading-snug font-semibold text-balance text-foreground">
              {customer.name}
            </h3>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {customer.primaryContactName}
            </p>
          </div>
          <StatusBadge kind="customer" status={customer.status} />
        </div>

        {dealer ? (
          <p className="mt-4 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <Buildings size={13} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{dealer.name}</span>
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4">
          <div className="flex items-center gap-1.5">
            <Wrench size={14} aria-hidden="true" className="text-muted-foreground" />
            <span className="text-sm font-semibold tabular-nums">{customer.equipmentCount}</span>
            <span className="text-xs text-muted-foreground">units</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ClipboardText size={14} aria-hidden="true" className="text-muted-foreground" />
            <span className="text-sm font-semibold tabular-nums">
              {customer.openServiceRequestCount}
            </span>
            <span className="text-xs text-muted-foreground">open requests</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
