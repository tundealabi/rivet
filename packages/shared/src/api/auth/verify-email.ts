import { z } from "zod";

export const VerifyEmailByEmailRequestSchema = z.object({
  email: z.string().email(),
});

export const VerifyEmailRequestSchema = VerifyEmailByEmailRequestSchema.extend({
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, "Code must be a 6-digit number"),
});

export const EmailVerificationStatusResponseSchema = z.object({
  active: z.boolean(),
  canResend: z.boolean(),
  canSendOtp: z.boolean(),
  canVerify: z.boolean(),
  codeExpiresAt: z.string().datetime().nullable(),
  codeExpiresInSeconds: z.number().int().nullable(),
  resendAvailableAt: z.string().datetime().nullable(),
  resendCooldownSeconds: z.number().int().nullable(),
  resendLockedUntil: z.string().datetime().nullable(),
  resendLockoutSeconds: z.number().int().nullable(),
  verifyLocked: z.boolean(),
});

export const SendEmailVerificationResponseSchema = z.object({
  sent: z.boolean(),
});

export const ResendEmailVerificationResponseSchema = z.object({
  sent: z.boolean(),
});

export const VerifyEmailResponseSchema = z.object({
  verified: z.boolean(),
});

export type VerifyEmailByEmailRequestWire = z.infer<
  typeof VerifyEmailByEmailRequestSchema
>;
export type VerifyEmailRequestWire = z.infer<typeof VerifyEmailRequestSchema>;
export type EmailVerificationStatusResponseWire = z.infer<
  typeof EmailVerificationStatusResponseSchema
>;
export type SendEmailVerificationResponseWire = z.infer<
  typeof SendEmailVerificationResponseSchema
>;
export type ResendEmailVerificationResponseWire = z.infer<
  typeof ResendEmailVerificationResponseSchema
>;
export type VerifyEmailResponseWire = z.infer<typeof VerifyEmailResponseSchema>;
