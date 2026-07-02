import { Prisma } from "@generated/prisma";

export type DomainErrorKind =
  "NOT_FOUND" | "RULE_VIOLATION" | "CONFLICT" | "INVALID_CREDENTIALS";

export interface OperationContext {
  tx?: Prisma.TransactionClient;
}
