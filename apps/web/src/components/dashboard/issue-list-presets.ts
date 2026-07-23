import { EMPTY_FILTERS } from "../issues/issue-filters";
import type { Issue } from "../issues/issue-types";
import { isIssueOverdue } from "../issues/issue-types";
import type { IssueFilters, IssueStatus } from "../issues/IssueFilterBar";

export type IssueListPreset =
  "open" | "in_progress" | "done_week" | "overdue" | "assigned_me";

export const OPEN_STATUSES: IssueStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
];

const PRESET_PARAM = "preset";

export function issuesPathForPreset(preset: IssueListPreset): string {
  return `/issues?${PRESET_PARAM}=${preset}`;
}

export function parseIssueListPreset(
  value: string | null
): IssueListPreset | null {
  if (
    value === "open" ||
    value === "in_progress" ||
    value === "done_week" ||
    value === "overdue" ||
    value === "assigned_me"
  ) {
    return value;
  }
  return null;
}

export function filtersFromPreset(preset: IssueListPreset): IssueFilters {
  switch (preset) {
    case "open":
      return { ...EMPTY_FILTERS, statuses: [...OPEN_STATUSES] };
    case "in_progress":
      return { ...EMPTY_FILTERS, statuses: ["in_progress"] };
    case "done_week":
      return { ...EMPTY_FILTERS, statuses: ["done"] };
    case "overdue":
      return { ...EMPTY_FILTERS };
    case "assigned_me":
      return { ...EMPTY_FILTERS, assignees: ["__me__"] };
  }
}

function isWithinDays(date: Date, days: number): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return date.getTime() >= cutoff.getTime();
}

/** Applies preset-specific filters that URL status/assignee chips cannot express alone. */
export function applyIssueListPreset(
  issues: Issue[],
  preset: IssueListPreset | null,
  currentUserName: string
): Issue[] {
  if (!preset) return issues;

  switch (preset) {
    case "open":
      return issues.filter((issue) => OPEN_STATUSES.includes(issue.status));
    case "in_progress":
      return issues.filter((issue) => issue.status === "in_progress");
    case "done_week":
      return issues.filter(
        (issue) => issue.status === "done" && isWithinDays(issue.updatedAt, 7)
      );
    case "overdue":
      return issues.filter((issue) => isIssueOverdue(issue));
    case "assigned_me":
      return issues.filter((issue) => issue.assignee === currentUserName);
  }
}
