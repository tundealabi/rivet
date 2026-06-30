import { Prisma } from "@generated/prisma";

export interface DbOptions {
  tx?: Prisma.TransactionClient;
}
