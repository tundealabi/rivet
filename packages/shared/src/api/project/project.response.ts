import { z } from "zod";

export const ProjectResponseSchema = z.object({
  archivedAt: z
    .string()
    .datetime()
    .nullable()
    .describe("When the project was archived; null if active"),
  createdAt: z.string().datetime().describe("Project creation timestamp"),
  description: z.string().describe("Project description"),
  id: z.string().uuid().describe("Project ID"),
  key: z
    .string()
    .describe("Immutable project key used as the issue ID prefix, e.g. MOB"),
  name: z.string().describe("Project name"),
});

export type ProjectResponseWire = z.infer<typeof ProjectResponseSchema>;

export const ProjectDetailResponseSchema = ProjectResponseSchema.extend({
  createdBy: z
    .string()
    .nullable()
    .describe("Display name of the project creator, if still available"),
  isCreator: z
    .boolean()
    .describe("Whether the requesting user created this project"),
});

export type ProjectDetailResponseWire = z.infer<
  typeof ProjectDetailResponseSchema
>;
