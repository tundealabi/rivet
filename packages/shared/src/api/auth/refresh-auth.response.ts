import { z } from "zod";

import { SignInAuthTokensResponseSchema } from "./signin-auth.response.js";

export const RefreshAuthResponseSchema = z.object({
  authTokens: SignInAuthTokensResponseSchema,
});

export type RefreshAuthResponseWire = z.infer<typeof RefreshAuthResponseSchema>;
