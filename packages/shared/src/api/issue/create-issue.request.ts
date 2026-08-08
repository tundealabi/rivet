import { z } from "zod";

import { IssuePriority, IssueStatus } from "../../enums/issue.enum.js";

export const CreateIssueRequestSchema = z.object({
  assigneeId: z
    .string()
    .uuid()
    .optional()
    .describe("Optional assignee user ID; must be an org member"),
  description: z.string().default("").describe("Issue description"),
  priority: z
    .nativeEnum(IssuePriority)
    .default(IssuePriority.MEDIUM)
    .describe("Issue priority"),
  projectId: z.string().uuid().describe("Project ID"),
  status: z
    .nativeEnum(IssueStatus)
    .default(IssueStatus.TODO)
    .describe("Issue status"),
  title: z.string().min(1).max(200).describe("Issue title"),
});

export type CreateIssueRequestWire = z.infer<typeof CreateIssueRequestSchema>;
