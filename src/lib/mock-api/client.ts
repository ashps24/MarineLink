import { useMockStateStore } from "@/stores/mock-state-store";

/**
 * Mock transport layer.
 *
 * ── Zoho integration seam ────────────────────────────────────────────────
 * Everything in `lib/mock-api` stands in for a real service client. When the
 * Zoho CRM / custom-module backend lands, replace the bodies of these
 * functions with real fetches. Call signatures and return shapes are the
 * contract the UI depends on, so they should stay stable.
 * ─────────────────────────────────────────────────────────────────────────
 */

export class MockApiError extends Error {
  readonly code: string;

  constructor(message: string, code = "MOCK_REQUEST_FAILED") {
    super(message);
    this.name = "MockApiError";
    this.code = code;
  }
}

function currentMockState() {
  return useMockStateStore.getState();
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps a mock read so every call gets realistic async behaviour plus the
 * demo-only loading / empty / error simulation controls.
 *
 * @param compute produces the resolved value from the fixtures
 * @param emptyValue what an "empty results" response looks like for this call
 */
export async function mockRequest<T>(compute: () => T, emptyValue: T): Promise<T> {
  const { mode, latencyMs } = currentMockState();

  if (mode === "loading") {
    // Never resolves for the lifetime of the query — demonstrates loading UI.
    await wait(1000 * 60 * 60);
  }

  await wait(latencyMs + Math.random() * 120);

  if (mode === "error") {
    throw new MockApiError(
      "We could not reach the MarineLink service. Please try again.",
      "SIMULATED_NETWORK_ERROR",
    );
  }

  if (mode === "empty") {
    return emptyValue;
  }

  return compute();
}

/** Case-insensitive "does any of these fields contain the query" helper. */
export function matchesSearch(query: string | undefined, ...fields: (string | undefined)[]): boolean {
  if (!query || !query.trim()) return true;
  const needle = query.trim().toLowerCase();
  return fields.some((field) => field?.toLowerCase().includes(needle));
}
