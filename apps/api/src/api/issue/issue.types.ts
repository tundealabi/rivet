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
  expectedAssigneeId?: string | null;
  expectedDescriptionHash?: string;
  expectedStatus?: IssueStatus;
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

export interface CreateIssueCommentInput {
  body: string;
  issueId: string;
}

export interface ListIssueCommentsInput {
  issueId: string;
  pagination: CursorPaginationInput;
}

export interface UpdateIssueCommentInput {
  body: string;
  commentId: string;
  issueId: string;
}

export interface DeleteIssueCommentInput {
  commentId: string;
  issueId: string;
}

export type { IssueSummaryResponseWire };
