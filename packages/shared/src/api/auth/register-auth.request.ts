import { z } from "zod";

import { REGEX_PASSWORD } from "../../constants.js";

export const RegisterAuthRequestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(30),
  lastName: z.string().min(1).max(30),
  orgName: z.string().min(3).max(50),
  password: z
    .string()
    .regex(
      REGEX_PASSWORD,
      "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (#?!@$%^&*-.)"
    ),
});

export type RegisterAuthRequestWire = z.infer<typeof RegisterAuthRequestSchema>;
