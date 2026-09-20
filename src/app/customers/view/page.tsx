"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CustomerDetail } from "@/components/customers/customer-detail";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { RestrictedState } from "@/components/shared/restricted-state";

function CustomerViewContent() {
  const id = useSearchParams().get("id");

  if (!id) {
    return (
      <RestrictedState
        title="No customer specified"
        description="This link is missing the customer to show. Open a customer from the directory instead."
      />
    );
  }

  return <CustomerDetail customerId={id} />;
}

export default function CustomerViewPage() {
  return (
    <React.Suspense fallback={<DetailSkeleton />}>
      <CustomerViewContent />
    </React.Suspense>
  );
}
