"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * A pointer from one record to another. Detail screens use these to bring
 * related context to the user rather than making them navigate and come back.
 */
export function RelatedRecordCard({
  href,
  title,
  subtitle,
  icon: IconComponent,
  trailing,
  className,
}: {
  href: string;
  title: string;
  subtitle?: string;
  icon?: Icon;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 transition-all",
        "hover:border-ocean/40 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      {IconComponent ? (
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-ocean/10 group-hover:text-ocean">
          <IconComponent size={16} aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {trailing}
      <ArrowRight
        size={14}
        aria-hidden="true"
        className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-ocean"
      />
    </Link>
  );
}
