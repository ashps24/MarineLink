"use client";

import { FlaskIcon, ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMockStateStore, mockModeLabels, type MockMode } from "@/stores/mock-state-store";
import { cn } from "@/lib/utils";

const modeDescriptions: Record<MockMode, string> = {
  normal: "Requests resolve with fixture data",
  loading: "Requests never resolve — shows loading UI",
  empty: "Requests resolve with no records",
  error: "Requests reject — shows error UI",
};

/**
 * Development affordance for exercising the loading, empty and error paths of
 * every screen without editing code. Ships with the mock layer and is removed
 * alongside it.
 */
export function DemoControls() {
  const mode = useMockStateStore((state) => state.mode);
  const setMode = useMockStateStore((state) => state.setMode);
  const reset = useMockStateStore((state) => state.reset);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={`Demo data state: ${mockModeLabels[mode]}`}
          className={cn(mode !== "normal" && "text-ocean")}
        >
          <FlaskIcon size={18} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs">
          Mock data state
          <span className="mt-0.5 block font-normal text-muted-foreground">
            Simulate how every screen responds
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(mockModeLabels) as MockMode[]).map((value) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => setMode(value)}
            className="items-start gap-3 py-2"
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-1.5 size-1.5 shrink-0 rounded-full",
                mode === value ? "bg-ocean" : "bg-muted-foreground/30",
              )}
            />
            <span className="min-w-0 flex-1">
              <span className={cn("block text-sm", mode === value && "font-medium text-ocean")}>
                {mockModeLabels[value]}
              </span>
              <span className="block text-xs text-muted-foreground">
                {modeDescriptions[value]}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => reset()}>
          <ArrowCounterClockwise size={16} aria-hidden="true" />
          Reset to normal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
