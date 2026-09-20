"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { DealerDetail } from "@/components/dealers/dealer-detail";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { RestrictedState } from "@/components/shared/restricted-state";

/**
 * A single static page for every dealer, reading which one by "?id=" rather
 * than a dynamic path segment. A real dealer's id is a Data Store ROWID —
 * unpredictable and assigned by the database — so it cannot be enumerated at
 * build time the way `generateStaticParams` needs; this fetches by id at
 * request time instead, and a newly created dealer is reachable immediately,
 * with no rebuild.
 */
function DealerViewContent() {
  const id = useSearchParams().get("id");

  if (!id) {
    return (
      <RestrictedState
        title="No dealer specified"
        description="This link is missing the dealer to show. Open a dealer from the directory instead."
      />
    );
  }

  return <DealerDetail dealerId={id} />;
}

export default function DealerViewPage() {
  return (
    <React.Suspense fallback={<DetailSkeleton />}>
      <DealerViewContent />
    </React.Suspense>
  );
}
