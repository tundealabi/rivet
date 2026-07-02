import { z } from "zod";

export const SignUpAuthResponseSchema = z.object({
  email: z.string().describe("User email"),
});

export type SignUpAuthResponseWire = z.infer<typeof SignUpAuthResponseSchema>;
