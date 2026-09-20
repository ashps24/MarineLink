"use client";

import * as React from "react";
import { ArrowRight, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { useServiceRequestActions, useServiceTeams } from "@/hooks/use-service-requests";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  allowedNextStatuses,
  canReassign,
  CUSTOMER_ACTION_LABELS,
} from "@/lib/constants/service-workflow";
import { serviceStatusConfig } from "@/lib/constants/status";
import type { ServiceRequest, ServiceRequestStatus } from "@/types";

const NOTE_CLASS =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/**
 * Moving a request through the pipeline, and handing it to another team.
 *
 * What a viewer may do is decided by `allowedNextStatuses`, not by hiding
 * buttons: a customer sees the two moves that are genuinely theirs to make
 * (confirm a fix held, or say it did not) and nothing else.
 */
export function StatusControl({ request }: { request: ServiceRequest }) {
  const { user } = useCurrentUser();
  const { changeStatus, reassign } = useServiceRequestActions();
  const { data: teams } = useServiceTeams();

  const options = allowedNextStatuses(user.role, request.status);
  const [target, setTarget] = React.useState<ServiceRequestStatus | "">("");
  const [note, setNote] = React.useState("");

  const [team, setTeam] = React.useState("");
  const [assignNote, setAssignNote] = React.useState("");

  async function onUpdateStatus() {
    if (!target) return;
    try {
      await changeStatus.mutateAsync({ request, toStatus: target, note });
      toast.success(`Moved to ${serviceStatusConfig[target].label}`, {
        description: note.trim() || undefined,
      });
      setTarget("");
      setNote("");
    } catch (error) {
      toast.error("Could not update the status", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  async function onReassign() {
    if (!team || team === request.assignedTeam) return;
    try {
      await reassign.mutateAsync({ request, toTeam: team, note: assignNote });
      toast.success(`Reassigned to ${team}`, { description: assignNote.trim() || undefined });
      setTeam("");
      setAssignNote("");
    } catch (error) {
      toast.error("Could not reassign the request", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  const reassignable = canReassign(user.role);
  if (options.length === 0 && !reassignable) {
    return (
      <p className="text-sm text-muted-foreground">
        This request is <StatusBadge kind="service" status={request.status} />. Your dealer
        updates its status as work progresses.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {options.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="next-status">Move to</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as ServiceRequestStatus)}>
              <SelectTrigger id="next-status" className="h-10 w-full">
                <SelectValue placeholder="Choose the next stage" />
              </SelectTrigger>
              <SelectContent>
                {options.map((status) => (
                  <SelectItem key={status} value={status}>
                    {user.role === "customer"
                      ? (CUSTOMER_ACTION_LABELS[status] ?? serviceStatusConfig[status].label)
                      : serviceStatusConfig[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {target ? (
            <div className="space-y-2">
              <Label htmlFor="status-note">Note (optional)</Label>
              <textarea
                id="status-note"
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Waiting on part #4521 from the supplier."
                className={NOTE_CLASS}
              />
            </div>
          ) : null}

          <Button
            size="sm"
            onClick={() => void onUpdateStatus()}
            disabled={!target || changeStatus.isPending}
          >
            {changeStatus.isPending ? "Updating…" : "Update status"}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      {reassignable ? (
        <div className="space-y-3 border-t border-border pt-5">
          <div className="space-y-2">
            <Label htmlFor="assign-team">Reassign to</Label>
            <Select value={team} onValueChange={setTeam}>
              <SelectTrigger id="assign-team" className="h-10 w-full">
                <SelectValue placeholder={request.assignedTeam} />
              </SelectTrigger>
              <SelectContent>
                {(teams ?? [])
                  .filter((name) => name !== request.assignedTeam)
                  .map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {team ? (
            <div className="space-y-2">
              <Label htmlFor="assign-note">Note (optional)</Label>
              <textarea
                id="assign-note"
                rows={2}
                value={assignNote}
                onChange={(event) => setAssignNote(event.target.value)}
                placeholder="Closer to the yard and has the parts on hand."
                className={NOTE_CLASS}
              />
            </div>
          ) : null}

          <Button
            size="sm"
            variant="outline"
            onClick={() => void onReassign()}
            disabled={!team || reassign.isPending}
          >
            <UsersThree aria-hidden="true" />
            {reassign.isPending ? "Reassigning…" : "Reassign"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
