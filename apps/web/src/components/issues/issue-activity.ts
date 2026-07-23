import type { IssueActivityEvent } from "./issue-types";
import {
  type IssuePriority,
  type IssueStatus,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from "./IssueFilterBar";

const STATUS_LABEL = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label])
) as Record<IssueStatus, string>;

const PRIORITY_LABEL = Object.fromEntries(
  PRIORITY_OPTIONS.map((o) => [o.value, o.label])
) as Record<IssuePriority, string>;

export function formatActivityMessage(event: IssueActivityEvent): string {
  switch (event.type) {
    case "created":
      return `${event.actor} created this issue`;
    case "status_changed":
      return `${event.actor} changed status from ${STATUS_LABEL[event.fromStatus!]} → ${STATUS_LABEL[event.toStatus!]}`;
    case "priority_changed":
      return `${event.actor} raised priority from ${PRIORITY_LABEL[event.fromPriority!]} → ${PRIORITY_LABEL[event.toPriority!]}`;
    case "assignee_changed": {
      const to = event.toAssignee ?? "Unassigned";
      if (!event.fromAssignee) {
        return `${event.actor} assigned this to ${to}`;
      }
      return `${event.actor} assigned this to ${to}`;
    }
    default:
      return `${event.actor} updated this issue`;
  }
}

export function createActivityEvent(
  partial: Omit<IssueActivityEvent, "id">
): IssueActivityEvent {
  return { ...partial, id: crypto.randomUUID() };
}

export const MOCK_ISSUE_ACTIVITY: Record<string, IssueActivityEvent[]> = {
  i1: [
    {
      id: "a1",
      type: "created",
      actor: "Ada Lovelace",
      createdAt: new Date("2026-07-15T09:00:00"),
    },
    {
      id: "a2",
      type: "status_changed",
      actor: "Grace Hopper",
      fromStatus: "backlog",
      toStatus: "todo",
      createdAt: new Date("2026-07-16T11:00:00"),
    },
    {
      id: "a3",
      type: "priority_changed",
      actor: "Ada Lovelace",
      fromPriority: "high",
      toPriority: "critical",
      createdAt: new Date("2026-07-18T14:00:00"),
    },
    {
      id: "a4",
      type: "assignee_changed",
      actor: "Bob",
      fromAssignee: null,
      toAssignee: "Grace Hopper",
      createdAt: new Date("2026-07-19T09:30:00"),
    },
  ],
  i2: [
    {
      id: "a5",
      type: "created",
      actor: "Ada Lovelace",
      createdAt: new Date("2026-07-10T11:00:00"),
    },
    {
      id: "a6",
      type: "status_changed",
      actor: "Alan Turing",
      fromStatus: "todo",
      toStatus: "in_progress",
      createdAt: new Date("2026-07-20T08:00:00"),
    },
  ],
};

export const MOCK_ISSUE_LABELS: Record<
  string,
  { id: string; name: string; color: string }[]
> = {
  i1: [
    { id: "l1", name: "bug", color: "#FEE2E2" },
    { id: "l2", name: "mobile", color: "#DBEAFE" },
  ],
  i2: [{ id: "l3", name: "backend", color: "#E0E7FF" }],
};

export function activityForIssue(issueId: string): IssueActivityEvent[] {
  return MOCK_ISSUE_ACTIVITY[issueId] ?? [];
}

export function labelsForIssue(issueId: string) {
  return MOCK_ISSUE_LABELS[issueId] ?? [];
}

export function watchersForIssue(issueId: string): string[] {
  if (issueId === "i1") return ["Ada Lovelace", "Grace Hopper"];
  if (issueId === "i2") return ["Alan Turing"];
  return [];
}
