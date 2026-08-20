import { z } from "zod";

export const ListProjectsQuerySchema = z.object({
  archived: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true")
    .describe(
      "When true, list only archived projects. When false (default), list only active projects."
    ),
});

export type ListProjectsQueryWire = z.infer<typeof ListProjectsQuerySchema>;
