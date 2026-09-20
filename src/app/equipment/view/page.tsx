"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { EquipmentDetail } from "@/components/equipment/equipment-detail";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { RestrictedState } from "@/components/shared/restricted-state";

function EquipmentViewContent() {
  const id = useSearchParams().get("id");

  if (!id) {
    return (
      <RestrictedState
        title="No equipment specified"
        description="This link is missing the unit to show. Open a unit from the Product Catalog instead."
      />
    );
  }

  return <EquipmentDetail equipmentId={id} />;
}

export default function EquipmentViewPage() {
  return (
    <React.Suspense fallback={<DetailSkeleton />}>
      <EquipmentViewContent />
    </React.Suspense>
  );
}
