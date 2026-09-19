"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { EntityAvatar } from "./entity-avatar";
import { cn } from "@/lib/utils";

export function DetailHeader({
  name,
  eyebrow,
  badges,
  meta,
  backHref,
  backLabel = "Back",
  actions,
  className,
}: {
  name: string;
  eyebrow?: string;
  badges?: React.ReactNode;
  meta?: React.ReactNode;
  backHref: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <Link prefetch={false}
        href={backHref}
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        {backLabel}
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <EntityAvatar name={name} size="lg" className="hidden sm:inline-flex" />
            <EntityAvatar name={name} size="md" className="sm:hidden" />
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="mt-1 font-heading text-2xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
                {name}
              </h1>
              {badges ? <div className="mt-3 flex flex-wrap items-center gap-2">{badges}</div> : null}
              {meta ? <div className="mt-3 text-sm text-muted-foreground">{meta}</div> : null}
            </div>
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
