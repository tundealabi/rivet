import { Issue, IssuePriority, IssueStatus } from "@generated/prisma";

import { Prisma } from "@/generated/prisma/client";

import {
  issueAssigneeInclude,
  issueCommentAuthorInclude,
  issueExportSelect,
} from "./issue.constants";

export type IssueWithAssignee = Prisma.IssueGetPayload<{
  include: typeof issueAssigneeInclude;
}>;

export type IssueCommentWithAuthor = Prisma.IssueCommentGetPayload<{
  include: typeof issueCommentAuthorInclude;
}>;

export type IssueExportRow = Prisma.IssueGetPayload<{
  select: typeof issueExportSelect;
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

export interface UpdateIssueCurrent {
  assigneeId?: string | null;
  description?: string;
  status?: IssueStatus;
}

export interface UpdateIssueInput {
  actorId?: string;
  assigneeId?: string | null;
  description?: string;
  id: string;
  priority?: IssuePriority;
  status?: IssueStatus;
  title?: string;
}

export interface UpdateIssueIfCurrentInput extends UpdateIssueInput {
  current: UpdateIssueCurrent;
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

export type IterateIssuesForExportInput = Omit<ListIssuesInput, "after">;

export interface ListIssuesResult {
  items: IssueWithAssignee[];
  next?: IssuesListCursor;
}

export interface FindIssueByIdInput {
  id: string;
}

export interface CreateIssueCommentInput {
  authorId: string;
  body: string;
  issueId: string;
  organizationId: string;
}

export interface FindIssueCommentInput {
  id: string;
  issueId: string;
}

export interface UpdateIssueCommentInput {
  body: string;
  id: string;
  issueId: string;
}

export interface ListIssueCommentsInput {
  after?: IssuesListCursor;
  issueId: string;
  limit: number;
}

export interface ListIssueCommentsResult {
  items: IssueCommentWithAuthor[];
  next?: IssuesListCursor;
}

export interface CountIssueCommentsByAuthorSinceInput {
  authorId: string;
  createdAtGte: Date;
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
