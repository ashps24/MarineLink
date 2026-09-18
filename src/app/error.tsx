"use client";

import * as React from "react";
import { ErrorState } from "@/components/shared/error-state";

/**
 * Route-level boundary. Anything a screen could not recover from surfaces
 * here rather than as a blank page.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // A real build reports this to an error service.
    console.error(error);
  }, [error]);

  return (
    <div className="py-10">
      <ErrorState
        title="This screen could not load"
        description="Something failed while rendering. Try again, or head back to the dashboard."
        onRetry={reset}
      />
    </div>
  );
}
