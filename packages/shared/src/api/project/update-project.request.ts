import { z } from "zod";

export const UpdateProjectRequestSchema = z
  .object({
    description: z.string().min(1).describe("Project description").optional(),
    name: z.string().min(1).max(100).describe("Project name").optional(),
  })
  .refine(
    (value) => value.description !== undefined || value.name !== undefined,
    {
      message: "At least one of name or description is required",
    }
  );

export type UpdateProjectRequestWire = z.infer<
  typeof UpdateProjectRequestSchema
>;
