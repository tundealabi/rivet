import { z } from "zod";

import { IssuePriority, IssueStatus } from "../../enums/issue.enum.js";

export const UpdateIssueRequestSchema = z
  .object({
    description: z.string().describe("Issue description").optional(),
    priority: z.nativeEnum(IssuePriority).describe("Issue priority").optional(),
    status: z.nativeEnum(IssueStatus).describe("Issue status").optional(),
    title: z.string().min(1).max(200).describe("Issue title").optional(),
  })
  .refine(
    (value) =>
      value.description !== undefined ||
      value.priority !== undefined ||
      value.status !== undefined ||
      value.title !== undefined,
    {
      message:
        "At least one of title, description, priority, or status is required",
    }
  );

export type UpdateIssueRequestWire = z.infer<typeof UpdateIssueRequestSchema>;
