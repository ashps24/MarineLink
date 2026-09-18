"use client";

import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRight, TrendUp, TrendDown, Minus } from "@phosphor-icons/react/dist/ssr";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/utils";

/**
 * Direction of travel for a metric, and whether that direction is good news.
 * Falling resolution time is good; falling equipment availability is not, so
 * the sign and the sentiment are separate inputs.
 */
export interface KpiComparison {
  label: string;
  direction: "up" | "down" | "flat";
  sentiment: "good" | "bad" | "neutral";
}

/**
 * An executive stat tile: one number, the comparison that makes it mean
 * something, and an optional trend shape. A bare count with no baseline is the
 * thing this component exists to prevent.
 */
export function KpiTile({
  label,
  value,
  unit,
  comparison,
  caption,
  icon: IconComponent,
  href,
  trend,
  trendLabel,
  emphasis = "default",
  insufficientData,
  index = 0,
}: {
  label: string;
  value: string | number;
  unit?: string;
  comparison?: KpiComparison;
  caption?: string;
  icon?: Icon;
  href?: string;
  trend?: number[];
  trendLabel?: string;
  emphasis?: "default" | "critical" | "positive";
  /** Set when the sample is too small to state a figure honestly. */
  insufficientData?: string;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();

  const DirectionIcon =
    comparison?.direction === "up" ? TrendUp : comparison?.direction === "down" ? TrendDown : Minus;

  const sentimentClass =
    comparison?.sentiment === "good"
      ? "text-success"
      : comparison?.sentiment === "bad"
        ? "text-destructive"
        : "text-muted-foreground";

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {IconComponent ? (
          <span
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
              emphasis === "critical"
                ? "bg-destructive/10 text-destructive"
                : emphasis === "positive"
                  ? "bg-success/10 text-success"
                  : "bg-ocean/10 text-ocean",
            )}
          >
            <IconComponent size={16} weight="bold" aria-hidden="true" />
          </span>
        ) : null}
      </div>

      {insufficientData ? (
        <>
          <p className="mt-4 font-heading text-2xl font-semibold tracking-tight text-muted-foreground">
            —
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{insufficientData}</p>
        </>
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between gap-3">
            <p className="font-heading text-3xl leading-none font-semibold tracking-tight tabular-nums text-foreground">
              {value}
              {unit ? (
                <span className="ml-1 text-base font-medium text-muted-foreground">{unit}</span>
              ) : null}
            </p>
            {trend && trend.length > 1 ? (
              <Sparkline values={trend} ariaLabel={trendLabel ?? `${label} trend`} />
            ) : null}
          </div>

          {comparison ? (
            <p className={cn("mt-2.5 flex items-center gap-1 text-xs font-medium", sentimentClass)}>
              <DirectionIcon size={12} weight="bold" aria-hidden="true" />
              {comparison.label}
            </p>
          ) : null}

          {caption ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              {caption}
              {href ? (
                <ArrowRight
                  size={12}
                  aria-hidden="true"
                  className="transition-transform group-hover/kpi:translate-x-0.5"
                />
              ) : null}
            </p>
          ) : null}
        </>
      )}
    </>
  );

  const shell = cn(
    "group/kpi block h-full rounded-2xl border border-border bg-card p-5 transition-all",
    href && "hover:-translate-y-0.5 hover:border-ocean/40 hover:shadow-lg hover:shadow-primary/5",
    href && "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
  );

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: reduceMotion ? 0 : index * 0.05, ease: "easeOut" }}
    >
      {href ? (
        <Link href={href} className={shell}>
          {body}
        </Link>
      ) : (
        <div className={shell}>{body}</div>
      )}
    </motion.div>
  );
}
