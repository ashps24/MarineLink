"use client";

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { motion, useReducedMotion } from "framer-motion";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { formatRelativeTime } from "@/lib/formatting/date";
import type { ServiceRequest } from "@/types";
import { cn } from "@/lib/utils";

/**
 * One request in a list. Reads as a card on phones and as a dense row from
 * tablet up, without a horizontally scrolling table.
 */
export function ServiceRequestRow({
  request,
  context,
  index = 0,
  className,
}: {
  request: ServiceRequest;
  /** Extra line of related context — customer or dealer name, where allowed. */
  context?: string;
  index?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: reduceMotion ? 0 : Math.min(index, 10) * 0.03 }}
      className={className}
    >
      <Link prefetch={false}
        href={`/service/${request.id}`}
        className={cn(
          "group block rounded-2xl border border-border bg-card p-4 transition-all",
          "hover:border-ocean/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        )}
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-xs tracking-tight text-muted-foreground">
                {request.referenceNumber}
              </span>
              <span aria-hidden="true" className="text-muted-foreground/40">
                ·
              </span>
              <span className="text-xs text-muted-foreground">
                Updated {formatRelativeTime(request.updatedAt)}
              </span>
            </div>

            <h3 className="mt-1.5 font-medium text-pretty text-foreground">{request.subject}</h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{request.assignedTeam}</span>
              {context ? (
                <>
                  <span aria-hidden="true" className="text-muted-foreground/40">
                    ·
                  </span>
                  <span className="truncate">{context}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge kind="service" status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>

          <CaretRight
            size={16}
            aria-hidden="true"
            className="mt-1 hidden shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block"
          />
        </div>
      </Link>
    </motion.div>
  );
}
