import { z } from "zod";

export const CreateOrganizationRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .describe("Organization name; trimmed, 3-50 characters"),
});

export type CreateOrganizationRequestWire = z.infer<
  typeof CreateOrganizationRequestSchema
>;
