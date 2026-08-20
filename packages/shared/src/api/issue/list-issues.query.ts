import { z } from "zod";

import { IssuePriority, IssueStatus } from "../../enums/issue.enum.js";
import { CursorPaginationQuerySchema } from "../pagination.wire.js";

export const IssueListFiltersSchema = z.object({
  assigneeId: z
    .union([z.string().uuid(), z.literal("me"), z.literal("unassigned")])
    .optional()
    .describe(
      "Filter by assignee user ID, 'me' for the current user, or 'unassigned'"
    ),
  priority: z
    .nativeEnum(IssuePriority)
    .optional()
    .describe("Filter by issue priority"),
  projectId: z.string().uuid().describe("Project ID"),
  status: z
    .nativeEnum(IssueStatus)
    .optional()
    .describe("Filter by issue status (e.g. board column)"),
});

export type IssueListFiltersWire = z.infer<typeof IssueListFiltersSchema>;

export const ListIssuesQuerySchema = CursorPaginationQuerySchema.merge(
  IssueListFiltersSchema
);

export type ListIssuesQueryWire = z.infer<typeof ListIssuesQuerySchema>;
