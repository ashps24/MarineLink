"use client";

import { useMockStateStore } from "@/stores/mock-state-store";

/**
 * The demo mock-mode is part of every query key so flipping the dev controls
 * re-runs requests immediately instead of serving a cached success.
 */
export function useMockKey(): string {
  return useMockStateStore((state) => state.mode);
}
