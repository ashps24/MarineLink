import { apiClient } from "@/lib/api/client";
import type { ServiceRequest, ServiceRequestStatus, User } from "@/types";
import { invalidateLiveCache } from "./live-source";

/**
 * The record of everything that has happened to a request: who moved it,
 * where to, who they handed it to, and what anyone said about it along the
 * way. Status history, reassignment and the comment thread are one stream
 * because that is how a reader needs to read them.
 */
export type ServiceEventKind = "status" | "assignment" | "comment";

export interface ServiceEvent {
  id: string;
  requestId: string;
  eventKind: ServiceEventKind;
  fromValue: string | null;
  toValue: string | null;
  note: string | null;
  actorName: string | null;
  actorRole: string | null;
  occurredAt: string;
}

interface ServiceEventRow {
  id: string;
  createdAt: string;
  requestId: string;
  eventKind: string;
  fromValue: string | null;
  toValue: string | null;
  note: string | null;
  actorName: string | null;
  actorRole: string | null;
  actorEmail: string | null;
  occurredAt: string | null;
}

function toEvent(row: ServiceEventRow): ServiceEvent {
  return {
    id: row.id,
    requestId: row.requestId,
    eventKind: (row.eventKind as ServiceEventKind) ?? "status",
    fromValue: row.fromValue,
    toValue: row.toValue,
    note: row.note,
    actorName: row.actorName,
    actorRole: row.actorRole,
    // The Data Store stamps CREATEDTIME in its own format; OccurredAt is the
    // value the app set, and is what the timeline should order by.
    occurredAt: row.occurredAt ?? row.createdAt,
  };
}

function byOldestFirst(a: ServiceEvent, b: ServiceEvent): number {
  return Date.parse(a.occurredAt) - Date.parse(b.occurredAt);
}

export async function getServiceEvents(requestId: string): Promise<ServiceEvent[]> {
  const rows = await apiClient.list<ServiceEventRow>("service-events", { requestId });
  return rows.map(toEvent).sort(byOldestFirst);
}

/** Every event across all requests — what the response-time metrics read. */
export async function getAllServiceEvents(): Promise<ServiceEvent[]> {
  const rows = await apiClient.list<ServiceEventRow>("service-events");
  return rows.map(toEvent).sort(byOldestFirst);
}

async function recordEvent(
  user: User,
  input: {
    requestId: string;
    eventKind: ServiceEventKind;
    fromValue?: string | null;
    toValue?: string | null;
    note?: string | null;
  },
): Promise<void> {
  await apiClient.create<ServiceEventRow>("service-events", {
    requestId: input.requestId,
    eventKind: input.eventKind,
    fromValue: input.fromValue ?? null,
    toValue: input.toValue ?? null,
    note: input.note?.trim() || null,
    actorName: user.name,
    actorRole: user.role,
    actorEmail: user.email,
    occurredAt: new Date().toISOString(),
  });
}

/**
 * Moves a request and logs the move in one call. The request row carries the
 * current state for every list and metric that reads it; the event carries
 * who changed it and why, which the request row has no room for.
 */
export async function changeServiceRequestStatus(
  user: User,
  request: ServiceRequest,
  toStatus: ServiceRequestStatus,
  note?: string,
): Promise<void> {
  const now = new Date().toISOString();
  const resolving = toStatus === "resolved" || toStatus === "closed";

  await apiClient.update<Record<string, unknown>>("service-requests", request.id, {
    status: toStatus,
    statusChangedAt: now,
    // Reopening has to clear the resolution stamp, or time-to-resolution
    // would keep counting a closure that was taken back.
    resolvedAt: resolving ? (request.resolvedAt ?? now) : null,
  });

  await recordEvent(user, {
    requestId: request.id,
    eventKind: "status",
    fromValue: request.status,
    toValue: toStatus,
    note,
  });

  invalidateLiveCache();
}

export async function reassignServiceRequest(
  user: User,
  request: ServiceRequest,
  toTeam: string,
  note?: string,
): Promise<void> {
  await apiClient.update<Record<string, unknown>>("service-requests", request.id, {
    assignedTeam: toTeam,
  });

  await recordEvent(user, {
    requestId: request.id,
    eventKind: "assignment",
    fromValue: request.assignedTeam,
    toValue: toTeam,
    note,
  });

  invalidateLiveCache();
}

export async function addServiceComment(
  user: User,
  requestId: string,
  note: string,
): Promise<void> {
  await recordEvent(user, { requestId, eventKind: "comment", note });
}
