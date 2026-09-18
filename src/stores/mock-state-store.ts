"use client";

import { create } from "zustand";

/**
 * Demo-only control over how the mock API behaves, so loading, empty and
 * error states can be exercised without touching code. This store disappears
 * with the mock layer once real services are wired up.
 */
export type MockMode = "normal" | "loading" | "empty" | "error";

export const mockModeLabels: Record<MockMode, string> = {
  normal: "Normal",
  loading: "Loading",
  empty: "Empty",
  error: "Error",
};

interface MockStateStore {
  mode: MockMode;
  latencyMs: number;
  setMode: (mode: MockMode) => void;
  setLatencyMs: (latencyMs: number) => void;
  reset: () => void;
}

const DEFAULT_LATENCY_MS = 380;

export const useMockStateStore = create<MockStateStore>((set) => ({
  mode: "normal",
  latencyMs: DEFAULT_LATENCY_MS,
  setMode: (mode) => set({ mode }),
  setLatencyMs: (latencyMs) => set({ latencyMs }),
  reset: () => set({ mode: "normal", latencyMs: DEFAULT_LATENCY_MS }),
}));
