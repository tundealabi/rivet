import { z } from "zod";

const StatusCountSchema = z.number().int().min(0);

export const IssueSummaryResponseSchema = z.object({
  byStatus: z
    .object({
      BACKLOG: StatusCountSchema,
      TODO: StatusCountSchema,
      IN_PROGRESS: StatusCountSchema,
      IN_REVIEW: StatusCountSchema,
      DONE: StatusCountSchema,
      CANCELLED: StatusCountSchema,
    })
    .describe("Issue counts keyed by status"),
  open: z.number().int().min(0).describe("Open issues (not done or cancelled)"),
  total: z.number().int().min(0).describe("Total issues in the project"),
});

export type IssueSummaryResponseWire = z.infer<
  typeof IssueSummaryResponseSchema
>;
