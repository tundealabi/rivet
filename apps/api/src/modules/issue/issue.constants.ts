import { Prisma } from "@/generated/prisma/client";

export const issueAssigneeInclude = {
  assignee: {
    select: {
      firstName: true,
      id: true,
      lastName: true,
    },
  },
} satisfies Prisma.IssueInclude;

export const issueCommentAuthorInclude = {
  author: {
    select: {
      firstName: true,
      id: true,
      lastName: true,
    },
  },
} satisfies Prisma.IssueCommentInclude;

export const issueListOrderBy = [
  { createdAt: "desc" },
  { id: "desc" },
] as const satisfies Prisma.IssueOrderByWithRelationInput[];

export const issueCommentListOrderBy = [
  { createdAt: "asc" },
  { id: "asc" },
] as const satisfies Prisma.IssueCommentOrderByWithRelationInput[];

/** CSV columns plus cursor keys. Narrower than the issue DTO include. */
export const issueExportSelect = {
  assignee: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
  createdAt: true,
  description: true,
  id: true,
  number: true,
  priority: true,
  project: {
    select: {
      key: true,
      name: true,
    },
  },
  status: true,
  title: true,
  updatedAt: true,
} satisfies Prisma.IssueSelect;
