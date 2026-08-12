import { z } from "zod";

import { IssuePriority, IssueStatus } from "../../enums/issue.enum.js";

export const ISSUE_DESCRIPTION_HASH_LENGTH = 64;

export const IssueDescriptionHashSchema = z
  .string()
  .length(ISSUE_DESCRIPTION_HASH_LENGTH)
  .regex(/^[0-9a-f]+$/, "Must be a lowercase SHA-256 hex digest")
  .describe("SHA-256 hex digest of the issue description");

export const UpdateIssueRequestSchema = z
  .object({
    assigneeId: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .describe("Assignee user ID; null to unassign"),
    description: z.string().describe("Issue description").optional(),
    expectedAssigneeId: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .describe(
        "Assignee ID the client last read; required when updating assigneeId"
      ),
    expectedDescriptionHash: IssueDescriptionHashSchema.optional().describe(
      "descriptionHash from the last read; required when updating description"
    ),
    expectedStatus: z
      .nativeEnum(IssueStatus)
      .optional()
      .describe("Status the client last read; required when updating status"),
    priority: z.nativeEnum(IssuePriority).describe("Issue priority").optional(),
    status: z.nativeEnum(IssueStatus).describe("Issue status").optional(),
    title: z.string().min(1).max(200).describe("Issue title").optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.assigneeId === undefined &&
      value.description === undefined &&
      value.priority === undefined &&
      value.status === undefined &&
      value.title === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "At least one of title, description, priority, status, or assigneeId is required",
      });
    }

    if (value.status !== undefined && value.expectedStatus === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "expectedStatus is required when updating status",
        path: ["expectedStatus"],
      });
    }

    if (
      value.assigneeId !== undefined &&
      value.expectedAssigneeId === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "expectedAssigneeId is required when updating assigneeId",
        path: ["expectedAssigneeId"],
      });
    }

    if (
      value.description !== undefined &&
      value.expectedDescriptionHash === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "expectedDescriptionHash is required when updating description",
        path: ["expectedDescriptionHash"],
      });
    }
  });

export type UpdateIssueRequestWire = z.infer<typeof UpdateIssueRequestSchema>;
