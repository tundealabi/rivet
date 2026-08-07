import { EmailVerificationContext } from "@generated/prisma";

export interface ApplyEmailVerificationResendInput {
  codeHash: string;
  expiresAt: Date;
  lastSentAt: Date;
  limits: EmailVerificationResendLimits;
}

export interface ApplyEmailVerificationSendInput {
  codeHash: string;
  expiresAt: Date;
  lastSentAt: Date;
}

export interface CreateEmailVerificationInput {
  codeHash: string;
  context: EmailVerificationContext;
  expiresAt: Date;
  lastSentAt: Date;
  userId: string;
}

export interface EmailVerificationResendLimits {
  baseCooldownSecs: number;
  cooldownMultiplier: number;
  lockoutHours: number;
  maxResends: number;
}

export interface EmailVerificationResendState {
  lastSentAt: Date;
  resendCount: number;
  resendLockedUntil: Date | null;
}

export interface EmailVerificationStatus {
  active: boolean;
  canResend: boolean;
  canSendOtp: boolean;
  canVerify: boolean;
  codeExpiresAt: string | null;
  codeExpiresInSeconds: number | null;
  resendAvailableAt: string | null;
  resendCooldownSeconds: number | null;
  resendLockedUntil: string | null;
  resendLockoutSeconds: number | null;
  verifyLocked: boolean;
}

export const INACTIVE_EMAIL_VERIFICATION_STATUS: EmailVerificationStatus = {
  active: false,
  canResend: false,
  canSendOtp: false,
  canVerify: false,
  codeExpiresAt: null,
  codeExpiresInSeconds: null,
  resendAvailableAt: null,
  resendCooldownSeconds: null,
  resendLockedUntil: null,
  resendLockoutSeconds: null,
  verifyLocked: false,
};

export interface EmailVerificationVerifyLimits {
  maxAttempts: number;
}

export interface EmailVerificationVerifyState {
  attempts: number;
  expiresAt: Date;
  storedCodeSecret: string;
}

export interface VerifyEmailVerificationInput {
  limits: EmailVerificationVerifyLimits;
  matchesStoredCode: (storedCode: string) => boolean;
}
