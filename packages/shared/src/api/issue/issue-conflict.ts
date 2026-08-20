import { z } from "zod";

import { IssueStatus } from "../../enums/issue.enum.js";
import { IssueDescriptionHashSchema } from "./update-issue.request.js";

export const IssueConflictDetailsSchema = z.object({
  conflicts: z.object({
    assigneeId: z
      .object({
        current: z.string().uuid().nullable(),
      })
      .optional(),
    description: z
      .object({
        current: z.string(),
        descriptionHash: IssueDescriptionHashSchema,
      })
      .optional(),
    status: z
      .object({
        current: z.nativeEnum(IssueStatus),
      })
      .optional(),
  }),
});

export type IssueConflictDetailsWire = z.infer<
  typeof IssueConflictDetailsSchema
>;
