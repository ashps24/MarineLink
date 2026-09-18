import { mockServiceRequests } from "@/data/mock-service-requests";
import { ServiceRequestDetail } from "@/components/service/service-request-detail";

export function generateStaticParams() {
  return mockServiceRequests.map((request) => ({ serviceRequestId: request.id }));
}

export default async function ServiceRequestDetailPage({
  params,
}: {
  params: Promise<{ serviceRequestId: string }>;
}) {
  const { serviceRequestId } = await params;
  return <ServiceRequestDetail requestId={serviceRequestId} />;
}
