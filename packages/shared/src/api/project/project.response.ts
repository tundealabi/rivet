import { z } from "zod";

export const ProjectResponseSchema = z.object({
  createdAt: z.string().datetime().describe("Project creation timestamp"),
  description: z.string().describe("Project description"),
  id: z.string().uuid().describe("Project ID"),
  name: z.string().describe("Project name"),
});

export type ProjectResponseWire = z.infer<typeof ProjectResponseSchema>;
