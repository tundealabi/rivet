import { z } from "zod";

import { IssuePriority, IssueStatus } from "../../enums/issue.enum.js";

export const IssueResponseSchema = z.object({
  createdAt: z.string().datetime().describe("Issue creation timestamp"),
  description: z.string().describe("Issue description"),
  id: z.string().uuid().describe("Issue ID"),
  number: z.number().int().positive().describe("Per-project issue number"),
  priority: z.nativeEnum(IssuePriority).describe("Issue priority"),
  projectId: z.string().uuid().describe("Project ID"),
  projectKey: z
    .string()
    .describe("Project key used as the issue ID prefix, e.g. MOB"),
  status: z.nativeEnum(IssueStatus).describe("Issue status"),
  title: z.string().describe("Issue title"),
  updatedAt: z.string().datetime().describe("Issue last update timestamp"),
});

export type IssueResponseWire = z.infer<typeof IssueResponseSchema>;
