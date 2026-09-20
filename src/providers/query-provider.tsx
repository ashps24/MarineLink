"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            // Data now comes from a real, shared backend rather than fixed
            // fixtures, so a change from another tab or another viewer should
            // show up here. Slate hosting has no server to push over a
            // websocket, so polling plus refetch-on-focus is the pragmatic
            // stand-in for "real-time": every list and detail view settles
            // within 12s of a change, sooner if the tab regains focus.
            refetchInterval: 12_000,
            refetchIntervalInBackground: false,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
