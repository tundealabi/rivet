import { z } from "zod";

const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

export const CreateProjectRequestSchema = z.object({
  description: z.string().min(1).describe("Project description"),
  key: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(
      z
        .string()
        .regex(
          PROJECT_KEY_PATTERN,
          "Key must be 2-10 uppercase letters and numbers, starting with a letter"
        )
    )
    .describe(
      "Immutable project key used as the issue ID prefix, e.g. MOB for MOB-42"
    ),
  name: z.string().min(1).max(100).describe("Project name"),
});

export type CreateProjectRequestWire = z.infer<
  typeof CreateProjectRequestSchema
>;
