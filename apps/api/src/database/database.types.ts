import { Prisma, PrismaClient } from "@generated/prisma";

import type { AppPrismaClientLike } from "./tenant-prisma.extension";

export interface DbOptions {
  tx?: AppPrismaClientLike;
}

export type PlainPrismaClient = PrismaClient | Prisma.TransactionClient;

export type { Prisma };
