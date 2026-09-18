"use client";

import { WarningOctagon, ArrowClockwise } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this data. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <WarningOctagon size={24} aria-hidden="true" />
      </span>
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <ArrowClockwise aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
