import { MetricsSkeleton, CardGridSkeleton } from "@/components/shared/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-72" />
      </div>
      <MetricsSkeleton />
      <CardGridSkeleton count={3} />
    </div>
  );
}
