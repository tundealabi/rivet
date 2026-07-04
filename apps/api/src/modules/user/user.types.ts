export interface CreateUserInput {
  email: string;
  emailVerifiedAt?: Date;
  firstName: string;
  hashedPassword: string;
  lastName: string;
}

export interface UpdateUserEmailVerificationInput {
  emailVerifiedAt?: Date | null;
}
