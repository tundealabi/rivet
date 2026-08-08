import { z } from "zod";

import { IssuePriority, IssueStatus } from "../../enums/issue.enum.js";

export const IssueAssigneeSchema = z.object({
  firstName: z.string().describe("Assignee first name"),
  id: z.string().uuid().describe("Assignee user ID"),
  lastName: z.string().describe("Assignee last name"),
});

export type IssueAssigneeWire = z.infer<typeof IssueAssigneeSchema>;

export const IssueProjectSchema = z.object({
  id: z.string().uuid().describe("Project ID"),
  key: z.string().describe("Project key used as the issue ID prefix, e.g. MOB"),
  name: z.string().describe("Project name"),
});

export type IssueProjectWire = z.infer<typeof IssueProjectSchema>;

export const IssueResponseSchema = z.object({
  assignee: IssueAssigneeSchema.nullable().describe(
    "Assigned org member, if any"
  ),
  createdAt: z.string().datetime().describe("Issue creation timestamp"),
  description: z.string().describe("Issue description"),
  id: z.string().uuid().describe("Issue ID"),
  number: z.number().int().positive().describe("Per-project issue number"),
  priority: z.nativeEnum(IssuePriority).describe("Issue priority"),
  project: IssueProjectSchema.describe("Project this issue belongs to"),
  status: z.nativeEnum(IssueStatus).describe("Issue status"),
  title: z.string().describe("Issue title"),
  updatedAt: z.string().datetime().describe("Issue last update timestamp"),
});

export type IssueResponseWire = z.infer<typeof IssueResponseSchema>;
