import {
  formatProjectIssueKey,
  formatRelativeTime,
  type Issue,
  memberByName,
  type TeamMember,
} from "../issues/issue-types";
import type { IssueStatus } from "../issues/IssueFilterBar";

export type ProjectActivityKind = "created" | "status_changed" | "commented";

export interface ProjectActivityItem {
  id: string;
  kind: ProjectActivityKind;
  actor: string;
  actorInitials: string;
  issueKey: string;
  issueTitle: string;
  issueId: string;
  timestamp: Date;
  statusLabel?: string;
}

export interface ProjectContributor {
  name: string;
  initials: string;
  issueCount: number;
}

const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  cancelled: "Cancelled",
};

function actorFirstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

export function formatActivityLine(item: ProjectActivityItem): {
  lead: string;
  detail: string;
  time: string;
} {
  const first = actorFirstName(item.actor);
  const time = formatRelativeTime(item.timestamp);

  switch (item.kind) {
    case "created":
      return {
        lead: `${first} created issue ${item.issueKey}`,
        detail: item.issueTitle,
        time,
      };
    case "status_changed":
      return {
        lead: `${first} moved ${item.issueKey} to ${item.statusLabel ?? "Done"}`,
        detail: item.issueTitle,
        time,
      };
    case "commented":
      return {
        lead: `${first} commented on ${item.issueKey}`,
        detail: item.issueTitle,
        time,
      };
  }
}

export function buildProjectActivity(
  issues: Issue[],
  limit = 15
): ProjectActivityItem[] {
  const events: ProjectActivityItem[] = [];

  for (const issue of issues) {
    const issueKey = formatProjectIssueKey(issue);

    events.push({
      id: `create-${issue.id}`,
      kind: "created",
      actor: issue.reporter,
      actorInitials: issue.reporterInitials,
      issueKey,
      issueTitle: issue.title,
      issueId: issue.id,
      timestamp: issue.createdAt,
    });

    if (issue.status === "done") {
      events.push({
        id: `done-${issue.id}`,
        kind: "status_changed",
        actor: issue.assignee ?? issue.reporter,
        actorInitials: issue.assigneeInitials ?? issue.reporterInitials,
        issueKey,
        issueTitle: issue.title,
        issueId: issue.id,
        timestamp: issue.updatedAt,
        statusLabel: STATUS_LABELS.done,
      });
    } else if (issue.status === "in_progress" || issue.status === "in_review") {
      events.push({
        id: `status-${issue.id}`,
        kind: "status_changed",
        actor: issue.assignee ?? issue.reporter,
        actorInitials: issue.assigneeInitials ?? issue.reporterInitials,
        issueKey,
        issueTitle: issue.title,
        issueId: issue.id,
        timestamp: issue.updatedAt,
        statusLabel: STATUS_LABELS[issue.status],
      });
    }

    for (const comment of issue.comments) {
      events.push({
        id: `comment-${comment.id}`,
        kind: "commented",
        actor: comment.author,
        actorInitials: comment.authorInitials,
        issueKey,
        issueTitle: issue.title,
        issueId: issue.id,
        timestamp: comment.createdAt,
      });
    }
  }

  return events
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

export function buildProjectContributors(
  issues: Issue[],
  teamMembers: TeamMember[]
): ProjectContributor[] {
  const counts = new Map<string, { initials: string; count: number }>();

  const bump = (name: string, initials: string) => {
    const existing = counts.get(name);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(name, { initials, count: 1 });
    }
  };

  for (const issue of issues) {
    bump(issue.reporter, issue.reporterInitials);
    if (issue.assignee) {
      const member = memberByName(teamMembers, issue.assignee);
      bump(issue.assignee, member?.initials ?? issue.assigneeInitials ?? "??");
    }
    for (const comment of issue.comments) {
      bump(comment.author, comment.authorInitials);
    }
  }

  return [...counts.entries()]
    .map(([name, { initials, count }]) => ({
      name,
      initials,
      issueCount: count,
    }))
    .sort((a, b) => b.issueCount - a.issueCount);
}
