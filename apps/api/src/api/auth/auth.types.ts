import { EmailVerification, User } from "@/generated/prisma/client";

export interface LoginAuthInput {
  email: string;
  ipAddress: string;
  password: string;
  userAgent: string;
}

export interface LogoutAuthInput {
  refreshToken: string;
}

export interface RegisterAuthInput extends Pick<
  LoginAuthInput,
  "email" | "ipAddress" | "password" | "userAgent"
> {
  firstName: string;
  lastName: string;
  orgName: string;
}

export interface RefreshTokensAuthInput {
  ipAddress: string;
  refreshToken: string;
}

export interface EmailVerificationByEmailInput {
  email: string;
}

export interface PendingSignUpVerification {
  record: EmailVerification;
  user: User;
}

export type ResendEmailVerificationInput = EmailVerificationByEmailInput;

export interface VerifyEmailInput extends EmailVerificationByEmailInput {
  code: string;
}
