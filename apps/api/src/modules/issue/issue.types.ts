import { Issue, IssuePriority, IssueStatus } from "@generated/prisma";

export interface CreateIssueInput {
  description: string;
  number: number;
  organizationId: string;
  priority: IssuePriority;
  projectId: string;
  status: IssueStatus;
  title: string;
}

export interface UpdateIssueInput {
  description?: string;
  priority?: IssuePriority;
  status?: IssueStatus;
  title?: string;
}

export interface IssuesListCursor {
  createdAt: Date;
  id: string;
}

export interface ListIssuesInput {
  after?: IssuesListCursor;
  limit: number;
  priority?: IssuePriority;
  projectId: string;
  status?: IssueStatus;
}

export interface ListIssuesResult {
  items: Issue[];
  next?: IssuesListCursor;
}

export interface FindIssueByIdInput {
  id: string;
}

export interface SummarizeIssuesInput {
  projectId: string;
}

export interface IssueStatusCounts {
  BACKLOG: number;
  CANCELLED: number;
  DONE: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  TODO: number;
}

export interface SummarizeIssuesResult {
  byStatus: IssueStatusCounts;
  open: number;
  total: number;
}
