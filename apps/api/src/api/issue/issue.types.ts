import type {
  CursorPaginationInput,
  IssueSummaryResponseWire,
} from "@rivet/shared/api";
import type { IssuePriority, IssueStatus } from "@rivet/shared/enums";

export interface CreateIssueInput {
  assigneeId?: string;
  description: string;
  priority: IssuePriority;
  projectId: string;
  status: IssueStatus;
  title: string;
}

export interface UpdateIssueInput {
  assigneeId?: string | null;
  description?: string;
  id: string;
  priority?: IssuePriority;
  status?: IssueStatus;
  title?: string;
}

export interface ListIssuesInput {
  /** UUID, `me`, or `unassigned` — validated by ListIssuesQuerySchema. */
  assigneeId?: string;
  pagination: CursorPaginationInput;
  priority?: IssuePriority;
  projectId: string;
  status?: IssueStatus;
}

export interface GetIssueSummaryInput {
  projectId: string;
}

export type { IssueSummaryResponseWire };
