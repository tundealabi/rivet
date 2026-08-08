import { Issue, IssuePriority, IssueStatus } from "@generated/prisma";

import { Prisma } from "@/generated/prisma/client";

import { issueAssigneeInclude } from "./issue.constants";

export type IssueWithAssignee = Prisma.IssueGetPayload<{
  include: typeof issueAssigneeInclude;
}>;

export interface CreateIssueInput {
  assigneeId?: string;
  description: string;
  number: number;
  organizationId: string;
  priority: IssuePriority;
  projectId: string;
  status: IssueStatus;
  title: string;
}

export interface UpdateIssueInput {
  assigneeId?: string | null;
  description?: string;
  priority?: IssuePriority;
  status?: IssueStatus;
  title?: string;
}

export interface IssuesListCursor {
  createdAt: Date;
  id: string;
}

export type IssueAssigneeFilter = string | null;

export interface ListIssuesInput {
  after?: IssuesListCursor;
  assigneeId?: IssueAssigneeFilter;
  limit: number;
  priority?: IssuePriority;
  projectId: string;
  status?: IssueStatus;
}

export interface ListIssuesResult {
  items: IssueWithAssignee[];
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

export type { Issue };
