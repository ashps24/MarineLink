"use client";

import type { ComparisonPeriod } from "@/lib/services";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ComparisonPeriod; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
];

/** Chooses the window every comparison on this dashboard is measured over. */
export function PeriodToggle({
  value,
  onChange,
}: {
  value: ComparisonPeriod;
  onChange: (next: ComparisonPeriod) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Comparison period"
      className="inline-flex rounded-lg border border-border bg-card p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            value === option.value
              ? "bg-ocean/10 text-ocean"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
