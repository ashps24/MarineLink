import Link from "next/link";
import { Compass } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export default function NotFound() {
  return (
    <div className="py-10">
      <EmptyState
        icon={Compass}
        title="This page does not exist"
        description="The link may be out of date, or the record may have been removed."
        action={
          <Button asChild variant="outline" size="lg" className="h-10">
            <Link href="/">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}
