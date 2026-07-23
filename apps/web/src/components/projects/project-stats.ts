import type { Issue } from "../issues/issue-types";
import type { IssueStatus } from "../issues/IssueFilterBar";

export interface ProjectStats {
  open: number;
  inProgress: number;
  doneThisWeek: number;
  overdue: number;
  members: number;
}

const CLOSED_STATUSES = new Set<IssueStatus>(["done", "cancelled"]);
const ACTIVE_WORK_STATUSES = new Set<IssueStatus>(["in_progress", "in_review"]);

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function computeProjectStats(
  issues: Issue[],
  now = new Date()
): ProjectStats {
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayStart = startOfDay(now);
  const memberNames = new Set<string>();

  let open = 0;
  let inProgress = 0;
  let doneThisWeek = 0;
  let overdue = 0;

  for (const issue of issues) {
    const isClosed = CLOSED_STATUSES.has(issue.status);

    if (!isClosed) open++;
    if (ACTIVE_WORK_STATUSES.has(issue.status)) inProgress++;
    if (issue.status === "done" && issue.updatedAt >= weekAgo) doneThisWeek++;
    if (issue.dueDate && !isClosed && startOfDay(issue.dueDate) < todayStart) {
      overdue++;
    }

    memberNames.add(issue.reporter);
    if (issue.assignee) memberNames.add(issue.assignee);
    for (const comment of issue.comments) {
      memberNames.add(comment.author);
    }
  }

  return {
    open,
    inProgress,
    doneThisWeek,
    overdue,
    members: memberNames.size,
  };
}
