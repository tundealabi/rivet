export interface LoginAuthInput {
  email: string;
  password: string;
}

export interface RegisterAuthInput extends LoginAuthInput {
  firstName: string;
  lastName: string;
  orgName: string;
}

export interface EmailVerificationByEmailInput {
  email: string;
}

export type ResendEmailVerificationInput = EmailVerificationByEmailInput;

export interface VerifyEmailInput extends EmailVerificationByEmailInput {
  code: string;
}
