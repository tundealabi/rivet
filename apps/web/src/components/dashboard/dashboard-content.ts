import { OrganizationRole } from "@rivet/shared";

import type { Issue } from "../issues/issue-types";
import {
  formatDueDate,
  formatProjectIssueKey,
  formatRelativeTime,
  isIssueOverdue,
} from "../issues/issue-types";
import type { IssuePriority } from "../issues/IssueFilterBar";
import type { ProjectSummary } from "../projects/project-types";
import type {
  DashboardMention,
  OrgActivityEvent,
  ProjectGlanceItem,
} from "./dashboard-types";

const PRIORITY_RANK: Record<IssuePriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const CLOSED_STATUSES = new Set(["done", "cancelled"]);
const IN_PROGRESS_STATUSES = new Set(["in_progress", "in_review"]);

function actorFirstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

function dueSortKey(issue: Issue): number {
  if (!issue.dueDate) return Number.MAX_SAFE_INTEGER;
  return issue.dueDate.getTime();
}

/** Overdue first, then due soon, then by priority. */
export function sortMyIssues(
  issues: Issue[],
  currentUserName: string
): Issue[] {
  return issues
    .filter((issue) => issue.assignee === currentUserName)
    .filter((issue) => !CLOSED_STATUSES.has(issue.status))
    .sort((a, b) => {
      const aOverdue = isIssueOverdue(a);
      const bOverdue = isIssueOverdue(b);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

      const dueDiff = dueSortKey(a) - dueSortKey(b);
      if (dueDiff !== 0) return dueDiff;

      const priorityDiff =
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
}

export function buildOrgActivityFeed(
  issues: Issue[],
  supplemental: OrgActivityEvent[],
  limit = 12
): OrgActivityEvent[] {
  const fromIssues: OrgActivityEvent[] = [];

  for (const issue of issues) {
    const issueKey = formatProjectIssueKey(issue);
    const href = `/projects/${issue.projectId}/issues/${issue.id}`;
    const projectMeta = {
      projectKey: issue.projectKey,
      projectName: issue.projectName,
      projectColor: issue.projectColor,
      projectId: issue.projectId,
      issueAssignee: issue.assignee,
      issueReporter: issue.reporter,
    };

    fromIssues.push({
      id: `created-${issue.id}`,
      kind: "issue_created",
      actor: issue.reporter,
      actorInitials: issue.reporterInitials,
      timestamp: issue.createdAt,
      lead: `${actorFirstName(issue.reporter)} created issue ${issueKey}`,
      detail: issue.title,
      href,
      ...projectMeta,
    });

    if (issue.status === "done") {
      fromIssues.push({
        id: `closed-${issue.id}`,
        kind: "issue_closed",
        actor: issue.assignee ?? issue.reporter,
        actorInitials: issue.assigneeInitials ?? issue.reporterInitials,
        timestamp: issue.updatedAt,
        lead: `${actorFirstName(issue.assignee ?? issue.reporter)} closed issue ${issueKey}`,
        detail: issue.title,
        href,
        ...projectMeta,
      });
    }

    for (const comment of issue.comments) {
      fromIssues.push({
        id: `comment-${comment.id}`,
        kind: "comment_added",
        actor: comment.author,
        actorInitials: comment.authorInitials,
        timestamp: comment.createdAt,
        lead: `${actorFirstName(comment.author)} commented on ${issueKey}`,
        detail: issue.title,
        href,
        ...projectMeta,
      });
    }
  }

  return [...fromIssues, ...supplemental]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

function userParticipatesInProject(
  issues: Issue[],
  projectId: string,
  user: string
): boolean {
  return issues.some(
    (issue) =>
      issue.projectId === projectId &&
      (issue.assignee === user ||
        issue.reporter === user ||
        issue.comments.some((c) => c.author === user))
  );
}

export function filterActivityForRole(
  events: OrgActivityEvent[],
  role: OrganizationRole,
  currentUserName: string,
  issues: Issue[]
): OrgActivityEvent[] {
  if (role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN) {
    return events;
  }

  return events.filter((event) => {
    if (event.actor === currentUserName) return true;
    if (event.issueAssignee === currentUserName) return true;
    if (event.issueReporter === currentUserName) return true;
    if (
      event.projectId &&
      userParticipatesInProject(issues, event.projectId, currentUserName)
    ) {
      return event.kind !== "member_joined";
    }
    if (event.kind === "member_joined" && event.actor === currentUserName) {
      return true;
    }
    return false;
  });
}

export function buildProjectGlanceItems(
  projects: ProjectSummary[],
  issues: Issue[],
  limit = 5
): ProjectGlanceItem[] {
  const items = projects.map((project) => {
    const projectIssues = issues.filter(
      (issue) => issue.projectId === project.id
    );
    let openCount = 0;
    let inProgressCount = 0;
    let doneCount = 0;
    let lastActiveAt = new Date(0);

    for (const issue of projectIssues) {
      if (!CLOSED_STATUSES.has(issue.status)) openCount++;
      if (IN_PROGRESS_STATUSES.has(issue.status)) inProgressCount++;
      if (issue.status === "done") doneCount++;

      const activeAt = Math.max(
        issue.updatedAt.getTime(),
        ...issue.comments.map((c) => c.createdAt.getTime())
      );
      if (activeAt > lastActiveAt.getTime()) {
        lastActiveAt = new Date(activeAt);
      }
    }

    const trackable = openCount + inProgressCount + doneCount;
    const donePercent =
      trackable === 0 ? 0 : Math.round((doneCount / trackable) * 100);

    return {
      id: project.id,
      name: project.name,
      key: project.key,
      color: project.color,
      openCount,
      inProgressCount,
      donePercent,
      lastActiveAt,
    };
  });

  return items
    .sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime())
    .slice(0, limit);
}

export function formatMentionLine(mention: DashboardMention): string {
  return `${mention.author} mentioned you in ${mention.issueKey}`;
}

export function formatActivityTimestamp(date: Date): string {
  return formatRelativeTime(date);
}

export function formatIssueDueLabel(issue: Issue): string | null {
  if (!issue.dueDate) return null;
  const overdue = isIssueOverdue(issue);
  return overdue
    ? `Overdue · ${formatDueDate(issue.dueDate)}`
    : formatDueDate(issue.dueDate);
}

export function isIssueDueOverdue(issue: Issue): boolean {
  return isIssueOverdue(issue);
}
