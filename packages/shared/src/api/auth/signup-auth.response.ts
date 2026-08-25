import { z } from "zod";

import { SignInAuthResponseSchema } from "./signin-auth.response.js";

/** Same wire shape as login — register issues a session. */
export const SignUpAuthResponseSchema = SignInAuthResponseSchema;

export type SignUpAuthResponseWire = z.infer<typeof SignUpAuthResponseSchema>;
