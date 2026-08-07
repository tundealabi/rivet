import { z } from "zod";

export const IssueSummaryQuerySchema = z.object({
  projectId: z.string().uuid().describe("Project ID"),
});

export type IssueSummaryQueryWire = z.infer<typeof IssueSummaryQuerySchema>;
