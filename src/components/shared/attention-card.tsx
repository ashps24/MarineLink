"use client";

import Link from "next/link";
import { ArrowRight, WarningCircle, Info, Warning } from "@phosphor-icons/react/dist/ssr";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DashboardInsight, InsightSeverity } from "@/types";

const severityConfig: Record<
  InsightSeverity,
  { icon: typeof Info; label: string; iconClass: string; edgeClass: string }
> = {
  critical: {
    icon: WarningCircle,
    label: "Critical",
    iconClass: "bg-destructive/10 text-destructive",
    edgeClass: "before:bg-destructive",
  },
  attention: {
    icon: Warning,
    label: "Needs attention",
    iconClass: "bg-warning/15 text-warning",
    edgeClass: "before:bg-warning",
  },
  info: {
    icon: Info,
    label: "For information",
    iconClass: "bg-info/10 text-info",
    edgeClass: "before:bg-info",
  },
};

/** Maps an insight to the record it is about. */
export function insightHref(insight: DashboardInsight): string {
  switch (insight.entityType) {
    case "dealer":
      return `/dealers/view/?id=${insight.entityId}`;
    case "customer":
      return `/customers/view/?id=${insight.entityId}`;
    case "equipment":
      return `/equipment/view/?id=${insight.entityId}`;
    case "service":
      return `/service/view/?id=${insight.entityId}`;
  }
}

export function AttentionCard({
  insight,
  index = 0,
}: {
  insight: DashboardInsight;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();
  const config = severityConfig[insight.severity];
  const SeverityIcon = config.icon;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: reduceMotion ? 0 : index * 0.04, ease: "easeOut" }}
    >
      <Link prefetch={false}
        href={insightHref(insight)}
        className={cn(
          "group relative block overflow-hidden rounded-2xl border border-border bg-card p-4 pl-5 transition-all",
          "before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-['']",
          "hover:border-ocean/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          config.edgeClass,
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
              config.iconClass,
            )}
          >
            <SeverityIcon size={16} weight="fill" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{insight.title}</p>
              <span className="sr-only">{config.label}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{insight.description}</p>
            <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-ocean">
              {insight.actionLabel}
              <ArrowRight
                size={12}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
