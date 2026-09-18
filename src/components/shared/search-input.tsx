"use client";

import * as React from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react/dist/ssr";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Debounced search box. Keeps its own text state so typing stays responsive
 * while the URL (and therefore the query) updates a beat later.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  label,
  className,
  debounceMs = 250,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
  debounceMs?: number;
}) {
  const [text, setText] = React.useState(value);
  const inputId = React.useId();

  React.useEffect(() => setText(value), [value]);

  React.useEffect(() => {
    if (text === value) return;
    const timer = window.setTimeout(() => onChange(text), debounceMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, debounceMs]);

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <MagnifyingGlass
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id={inputId}
        type="search"
        value={text}
        placeholder={placeholder}
        onChange={(event) => setText(event.target.value)}
        className="h-10 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {text ? (
        <button
          type="button"
          onClick={() => setText("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
