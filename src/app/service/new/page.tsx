"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Wrench } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DetailSection } from "@/components/shared/detail-section";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { DetailSkeleton } from "@/components/shared/loading-skeleton";
import { useEquipmentList } from "@/hooks/use-equipment";
import { useCreateServiceRequest } from "@/hooks/use-service-requests";
import type { ServiceRequest } from "@/types";

const PRIORITIES: { value: ServiceRequest["priority"]; label: string; hint: string }[] = [
  { value: "low", label: "Low", hint: "Can wait for the next scheduled visit" },
  { value: "medium", label: "Medium", hint: "Should be looked at this week" },
  { value: "high", label: "High", hint: "Affecting operations now" },
  { value: "urgent", label: "Urgent", hint: "Unit unusable, work is stopped" },
];

function RequestForm() {
  const router = useRouter();
  const preselected = useSearchParams().get("equipmentId");
  const { data: equipment, isPending, isError, refetch } = useEquipmentList();
  const createRequest = useCreateServiceRequest();

  const [equipmentId, setEquipmentId] = React.useState(preselected ?? "");
  const [subject, setSubject] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [priority, setPriority] = React.useState<ServiceRequest["priority"]>("medium");
  const [scheduled, setScheduled] = React.useState(false);
  const [outOfService, setOutOfService] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);

  const units = equipment ?? [];
  const missing = {
    equipmentId: !equipmentId,
    subject: subject.trim().length < 4,
    summary: summary.trim().length < 10,
  };
  const hasErrors = Object.values(missing).some(Boolean);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setShowErrors(true);
    if (hasErrors) return;

    try {
      const created = await createRequest.mutateAsync({
        equipmentId,
        subject: subject.trim(),
        summary: summary.trim(),
        priority,
        kind: scheduled ? "scheduled" : "corrective",
        unitOutOfService: outOfService,
      });
      toast.success("Service request raised", { description: created.referenceNumber });
      router.push(`/service/view/?id=${created.id}`);
    } catch (error) {
      toast.error("Could not raise the request", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  if (isPending) return <DetailSkeleton />;
  if (isError) {
    return (
      <ErrorState
        title="Could not load your equipment"
        description="The equipment service did not respond."
        onRetry={() => refetch()}
      />
    );
  }
  if (units.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="No equipment on record"
        description="A service request is raised against a unit, and there are none registered to your account yet."
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <DetailSection title="Which unit" description="The equipment that needs attention">
        <div className="space-y-2">
          <Label htmlFor="equipment">Equipment</Label>
          <Select value={equipmentId} onValueChange={setEquipmentId}>
            <SelectTrigger id="equipment" className="h-10 w-full">
              <SelectValue placeholder="Select a unit" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name} · {unit.serialNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showErrors && missing.equipmentId ? (
            <p className="text-xs text-destructive">Choose the unit this request is about.</p>
          ) : null}
        </div>
      </DetailSection>

      <DetailSection title="What is happening" description="Enough detail for a technician to prepare">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="subject">Summary line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Hydraulic pressure drops during haul-out"
              className="h-10"
            />
            {showErrors && missing.subject ? (
              <p className="text-xs text-destructive">Give the request a short title.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Description</Label>
            <textarea
              id="summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={5}
              placeholder="When it started, what the operator observed, anything already tried."
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
            {showErrors && missing.summary ? (
              <p className="text-xs text-destructive">
                Add a little more detail — at least a sentence.
              </p>
            ) : null}
          </div>
        </div>
      </DetailSection>

      <DetailSection title="How urgent" description="This sets where the request lands in the queue">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="priority">Urgency</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as ServiceRequest["priority"])}
            >
              <SelectTrigger id="priority" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} — {option.hint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Label htmlFor="out-of-service">Unit is out of service</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                The machine cannot be used until this is resolved.
              </p>
            </div>
            <Switch id="out-of-service" checked={outOfService} onCheckedChange={setOutOfService} />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Label htmlFor="scheduled">Planned work</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Scheduled maintenance rather than a fault.
              </p>
            </div>
            <Switch id="scheduled" checked={scheduled} onCheckedChange={setScheduled} />
          </div>
        </div>
      </DetailSection>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" className="h-10" disabled={createRequest.isPending}>
          {createRequest.isPending ? "Raising request…" : "Raise service request"}
        </Button>
        <Button asChild type="button" variant="ghost" size="lg" className="h-10">
          <Link prefetch={false} href="/service">
            Cancel
          </Link>
        </Button>
      </div>
    </form>
  );
}

export default function NewServiceRequestPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Request service"
        description="Raise a request against a unit. It appears in the service queue immediately."
        eyebrow={
          <Link
            prefetch={false}
            href="/service"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={12} aria-hidden="true" />
            Service
          </Link>
        }
      />
      <div className="max-w-2xl">
        <React.Suspense fallback={<DetailSkeleton />}>
          <RequestForm />
        </React.Suspense>
      </div>
    </div>
  );
}
