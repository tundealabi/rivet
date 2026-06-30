import { z } from "zod";

export const SignInAuthTokensResponseSchema = z.object({
  accessToken: z.string().describe("JWT access token"),
  refreshToken: z.string().describe("Long-lived refresh token"),
});

export const SignInOrgResponseSchema = z.object({
  id: z.string().describe("Organization ID"),
  name: z.string().describe("Organization name"),
});

export const SignInUserResponseSchema = z.object({
  email: z.string().describe("User email"),
  firstName: z.string().describe("User first name"),
  lastName: z.string().describe("User last name"),
});

export const SignInAuthResponseSchema = z.object({
  authTokens: SignInAuthTokensResponseSchema,
  org: SignInOrgResponseSchema,
  user: SignInUserResponseSchema,
});

export type SignInAuthTokensWire = z.infer<
  typeof SignInAuthTokensResponseSchema
>;
export type SignInOrgWire = z.infer<typeof SignInOrgResponseSchema>;
export type SignInUserWire = z.infer<typeof SignInUserResponseSchema>;
export type SignInAuthResponseWire = z.infer<typeof SignInAuthResponseSchema>;
