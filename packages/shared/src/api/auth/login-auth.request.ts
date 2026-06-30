import { z } from "zod";

export const LoginAuthRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginAuthRequestWire = z.infer<typeof LoginAuthRequestSchema>;
