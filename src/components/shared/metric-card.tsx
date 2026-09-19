"use client";

import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A single headline number. Every metric answers a question and, where a
 * sensible destination exists, links straight to the records behind it.
 */
export function MetricCard({
  label,
  value,
  caption,
  icon: IconComponent,
  href,
  emphasis = "default",
  index = 0,
}: {
  label: string;
  value: number | string;
  caption?: string;
  icon?: Icon;
  href?: string;
  emphasis?: "default" | "critical";
  index?: number;
}) {
  const reduceMotion = useReducedMotion();

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {IconComponent ? (
          <span
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-lg",
              emphasis === "critical"
                ? "bg-destructive/10 text-destructive"
                : "bg-ocean/10 text-ocean",
            )}
          >
            <IconComponent size={16} aria-hidden="true" weight="bold" />
          </span>
        ) : null}
      </div>
      <p className="mt-4 font-heading text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {caption ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          {caption}
          {href ? (
            <ArrowRight
              aria-hidden="true"
              size={12}
              className="transition-transform group-hover/metric:translate-x-0.5"
            />
          ) : null}
        </p>
      ) : null}
    </>
  );

  const shell = cn(
    "group/metric block rounded-2xl border border-border bg-card p-5 transition-all",
    href && "hover:-translate-y-0.5 hover:border-ocean/40 hover:shadow-lg hover:shadow-primary/5",
    href &&
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  );

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: reduceMotion ? 0 : index * 0.05, ease: "easeOut" }}
    >
      {href ? (
        <Link prefetch={false} href={href} className={shell}>
          {body}
        </Link>
      ) : (
        <div className={shell}>{body}</div>
      )}
    </motion.div>
  );
}
