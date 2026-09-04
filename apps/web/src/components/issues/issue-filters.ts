import type { IssueFilters, IssuePriority, IssueStatus } from "./issue-types";

export const EMPTY_FILTERS: IssueFilters = {
  search: "",
  projectIds: [],
  statuses: [],
  priorities: [],
  assignees: [],
};

export const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export const PRIORITY_OPTIONS: { value: IssuePriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function hasActiveFilters(filters: IssueFilters): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.projectIds.length > 0 ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.assignees.length > 0
  );
}

export interface FilterableIssue {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee: string | null;
  projectId: string;
}

export function filterIssues<T extends FilterableIssue>(
  issues: T[],
  filters: IssueFilters,
  currentUserName: string
): T[] {
  const query = filters.search.trim().toLowerCase();

  return issues.filter((issue) => {
    if (query) {
      const haystack = `${issue.title} ${issue.description}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (
      filters.projectIds.length > 0 &&
      !filters.projectIds.includes(issue.projectId)
    ) {
      return false;
    }

    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(issue.status)
    ) {
      return false;
    }

    if (
      filters.priorities.length > 0 &&
      !filters.priorities.includes(issue.priority)
    ) {
      return false;
    }

    if (filters.assignees.length > 0) {
      const matches = filters.assignees.some((value) => {
        if (value === "__me__") return issue.assignee === currentUserName;
        if (value === "__unassigned__") return issue.assignee === null;
        return issue.assignee === value;
      });
      if (!matches) return false;
    }

    return true;
  });
}
