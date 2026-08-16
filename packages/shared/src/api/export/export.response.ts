import { z } from "zod";

import { ExportJobStatus } from "../../enums/export.enum.js";

export const ExportJobResponseSchema = z.object({
  createdAt: z.string().datetime().describe("When the export was requested"),
  downloadUrl: z
    .string()
    .url()
    .nullable()
    .describe("Signed GET URL when status is SUCCEEDED; otherwise null"),
  error: z.string().nullable().describe("Failure reason when status is FAILED"),
  expiresAt: z
    .string()
    .datetime()
    .nullable()
    .describe("When the object expires; null until upload completes"),
  id: z.string().uuid().describe("Export job ID"),
  status: z.nativeEnum(ExportJobStatus).describe("Job status"),
});

export type ExportJobResponseWire = z.infer<typeof ExportJobResponseSchema>;
