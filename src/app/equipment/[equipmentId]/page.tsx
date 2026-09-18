import { mockEquipment } from "@/data/mock-equipment";
import { EquipmentDetail } from "@/components/equipment/equipment-detail";

export function generateStaticParams() {
  return mockEquipment.map((item) => ({ equipmentId: item.id }));
}

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ equipmentId: string }>;
}) {
  const { equipmentId } = await params;
  return <EquipmentDetail equipmentId={equipmentId} />;
}
