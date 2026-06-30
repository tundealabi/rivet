export interface RegisterAuthInput {
  email: string;
  firstName: string;
  lastName: string;
  orgName: string;
  password: string;
}

export interface LoginAuthInput {
  email: string;
  password: string;
}
