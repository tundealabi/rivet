export enum IssuePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum IssueStatus {
  BACKLOG = "BACKLOG",
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
}

/**
 * Allowed status moves, including identity (no-op) so retries of the same
 * status are not rule violations. Illegal edges are a domain rule, not a
 * concurrency conflict.
 */
export const ISSUE_STATUS_TRANSITIONS: Record<
  IssueStatus,
  readonly IssueStatus[]
> = {
  [IssueStatus.BACKLOG]: [
    IssueStatus.BACKLOG,
    IssueStatus.TODO,
    IssueStatus.CANCELLED,
  ],
  [IssueStatus.TODO]: [
    IssueStatus.TODO,
    IssueStatus.BACKLOG,
    IssueStatus.IN_PROGRESS,
    IssueStatus.CANCELLED,
  ],
  [IssueStatus.IN_PROGRESS]: [
    IssueStatus.IN_PROGRESS,
    IssueStatus.TODO,
    IssueStatus.IN_REVIEW,
    IssueStatus.CANCELLED,
  ],
  [IssueStatus.IN_REVIEW]: [
    IssueStatus.IN_REVIEW,
    IssueStatus.IN_PROGRESS,
    IssueStatus.DONE,
    IssueStatus.CANCELLED,
  ],
  [IssueStatus.DONE]: [
    IssueStatus.DONE,
    IssueStatus.IN_REVIEW,
    IssueStatus.TODO,
    IssueStatus.CANCELLED,
  ],
  [IssueStatus.CANCELLED]: [
    IssueStatus.CANCELLED,
    IssueStatus.BACKLOG,
    IssueStatus.TODO,
  ],
};

export function isIssueStatusTransitionAllowed(
  from: IssueStatus,
  to: IssueStatus
): boolean {
  return ISSUE_STATUS_TRANSITIONS[from].includes(to);
}
