import { mockDealers } from "@/data/mock-dealers";
import { DealerDetail } from "@/components/dealers/dealer-detail";

/**
 * The export needs every reachable dealer path up front. "me" is included so
 * the dealer role's "My Dealer Profile" link resolves without a redirect.
 */
export function generateStaticParams() {
  return [...mockDealers.map((dealer) => ({ dealerId: dealer.id })), { dealerId: "me" }];
}

export default async function DealerDetailPage({
  params,
}: {
  params: Promise<{ dealerId: string }>;
}) {
  const { dealerId } = await params;
  return <DealerDetail dealerId={dealerId} />;
}
