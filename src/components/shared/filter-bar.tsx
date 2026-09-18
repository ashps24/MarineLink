"use client";

import * as React from "react";
import { FunnelSimple, X } from "@phosphor-icons/react/dist/ssr";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDefinition {
  key: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

/**
 * Search plus a row of selects. Collapses behind a toggle on small screens so
 * a filtered list still reads as a list on a phone.
 */
export function FilterBar({
  search,
  filters,
  isFiltered,
  onReset,
  resultCount,
  resultNoun,
  className,
}: {
  search: React.ReactNode;
  filters: FilterDefinition[];
  isFiltered: boolean;
  onReset: () => void;
  resultCount?: number;
  resultNoun?: string;
  className?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1">{search}</div>
        {filters.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-10 md:hidden"
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
          >
            <FunnelSimple aria-hidden="true" />
            Filters
          </Button>
        ) : null}
      </div>

      {filters.length > 0 ? (
        <div
          className={cn(
            "flex-wrap items-center gap-2",
            expanded ? "flex" : "hidden",
            "md:flex",
          )}
        >
          {filters.map((filter) => (
            <div key={filter.key} className="min-w-0 flex-1 md:flex-none">
              <Select value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger className="h-10 w-full md:w-auto md:min-w-40" aria-label={filter.label}>
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          {isFiltered ? (
            <Button type="button" variant="ghost" size="lg" className="h-10" onClick={onReset}>
              <X aria-hidden="true" />
              Clear
            </Button>
          ) : null}
        </div>
      ) : null}

      {typeof resultCount === "number" ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {resultCount} {resultNoun ?? "result"}
          {resultCount === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}
