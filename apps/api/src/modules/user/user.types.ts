export interface CreateUserInput {
  email: string;
  emailVerifiedAt?: Date;
  emailVerifyOtp?: string | null;
  emailVerifyOtpExpiresAt?: Date;
  firstName: string;
  hashedPassword: string;
  lastName: string;
}
