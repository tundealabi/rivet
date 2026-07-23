import { z } from "zod";

export const CreateProjectRequestSchema = z.object({
  description: z.string().min(1).describe("Project description"),
  name: z.string().min(1).max(100).describe("Project name"),
});

export type CreateProjectRequestWire = z.infer<
  typeof CreateProjectRequestSchema
>;
