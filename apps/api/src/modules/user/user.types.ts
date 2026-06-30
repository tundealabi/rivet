import { OperationContext } from "@/common/types";

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  ctx?: OperationContext;
}

export interface FindUserByEmailInput {
  email: string;
  ctx?: OperationContext;
}

export interface FindUserByIdInput {
  id: string;
  ctx?: OperationContext;
}
