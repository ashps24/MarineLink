import { mockCustomers } from "@/data/mock-customers";
import { CustomerDetail } from "@/components/customers/customer-detail";

export function generateStaticParams() {
  return [
    ...mockCustomers.map((customer) => ({ customerId: customer.id })),
    { customerId: "me" },
  ];
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  return <CustomerDetail customerId={customerId} />;
}
