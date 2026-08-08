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
