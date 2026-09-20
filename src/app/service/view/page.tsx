"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ServiceRequestDetail } from "@/components/service/service-request-detail";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { RestrictedState } from "@/components/shared/restricted-state";

function ServiceViewContent() {
  const id = useSearchParams().get("id");

  if (!id) {
    return (
      <RestrictedState
        title="No request specified"
        description="This link is missing the service request to show. Open a request from the list instead."
      />
    );
  }

  return <ServiceRequestDetail requestId={id} />;
}

export default function ServiceViewPage() {
  return (
    <React.Suspense fallback={<DetailSkeleton />}>
      <ServiceViewContent />
    </React.Suspense>
  );
}
