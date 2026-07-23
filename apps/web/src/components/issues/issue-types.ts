import type { IssuePriority, IssueStatus } from "./IssueFilterBar";

export interface IssueLabel {
  id: string;
  name: string;
  color: string;
}

export interface CommentReaction {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

/** Full-page issue detail content width — centered layout. */
export const ISSUE_DETAIL_PAGE_MAX_W = "1100px";

export interface IssueComment {
  id: string;
  author: string;
  authorInitials: string;
  body: string;
  createdAt: Date;
  reactions: CommentReaction[];
  /** Optimistic sync state — undefined means confirmed. */
  syncStatus?: "pending" | "failed";
}

export type IssueActivityType =
  "created" | "status_changed" | "priority_changed" | "assignee_changed";

export interface IssueActivityEvent {
  id: string;
  type: IssueActivityType;
  actor: string;
  createdAt: Date;
  fromStatus?: IssueStatus;
  toStatus?: IssueStatus;
  fromPriority?: IssuePriority;
  toPriority?: IssuePriority;
  fromAssignee?: string | null;
  toAssignee?: string | null;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee: string | null;
  assigneeInitials: string | null;
  reporter: string;
  reporterInitials: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  projectColor: string;
  comments: IssueComment[];
  commentCount: number;
  activity: IssueActivityEvent[];
  labels: IssueLabel[];
  watchers: string[];
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  name: string;
  initials: string;
}

export const ORG_ISSUE_PREFIX = "RIV";

export function formatIssueKey(number: number): string {
  return `${ORG_ISSUE_PREFIX}-${number}`;
}

export function formatProjectIssueKey(
  issue: Pick<Issue, "projectKey" | "number">
): string {
  return `${issue.projectKey}-${issue.number}`;
}

export const STATUS_DOT_COLOR: Record<IssueStatus, string> = {
  backlog: "#9CA3AF",
  todo: "#9CA3AF",
  in_progress: "#2563EB",
  in_review: "#7C3AED",
  done: "#16A34A",
  cancelled: "#DC2626",
};

export const PRIORITY_DOT_COLOR: Record<IssuePriority, string> = {
  low: "#9CA3AF",
  medium: "#2563EB",
  high: "#EA580C",
  critical: "#DC2626",
};

export const PRIORITY_BADGE_STYLE: Record<
  IssuePriority,
  { bg: string; color: string }
> = {
  low: { bg: "#F3F4F6", color: "#6B7280" },
  medium: { bg: "#EFF6FF", color: "#2563EB" },
  high: { bg: "#FFF7ED", color: "#EA580C" },
  critical: { bg: "#FEF2F2", color: "#DC2626" },
};

export const DEFAULT_REACTIONS = ["👍", "❤️", "🎉"] as const;

/** Most recent actor from activity/comments, falling back to reporter. */
export function getLastUpdatedBy(issue: Issue): string {
  const events = [
    ...issue.activity.map((event) => ({
      actor: event.actor,
      at: event.createdAt,
    })),
    ...issue.comments.map((comment) => ({
      actor: comment.author,
      at: comment.createdAt,
    })),
  ];

  if (events.length === 0) return issue.reporter;

  events.sort((a, b) => b.at.getTime() - a.at.getTime());
  return events[0].actor;
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDueDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function memberByName(
  members: TeamMember[],
  name: string | null
): TeamMember | null {
  if (!name) return null;
  return members.find((m) => m.name === name) ?? null;
}

export function isIssueOverdue(
  issue: Pick<Issue, "dueDate" | "status">
): boolean {
  if (!issue.dueDate) return false;
  if (issue.status === "done" || issue.status === "cancelled") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(issue.dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}
