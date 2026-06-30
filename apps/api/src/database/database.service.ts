import { Prisma, PrismaClient } from "@generated/prisma";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { ENV_KEYS } from "@/common/constants";
import { OperationContext } from "@/common/types";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private _client: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    this._client = new PrismaClient({
      adapter: new PrismaPg(
        this.configService.getOrThrow(ENV_KEYS.DATABASE_URL)
      ),
    });
  }

  async onModuleInit() {
    await this._client.$connect();
  }

  async onModuleDestroy() {
    await this._client.$disconnect();
  }

  get client(): PrismaClient {
    return this._client;
  }

  isUniqueConstraintViolationError(error: Error, field: string): boolean {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      return false;
    }

    const target = error.meta?.target;
    return Array.isArray(target) && target.includes(field);
  }

  resolveClient<TClient>(
    context: OperationContext | undefined,
    defaultClient: TClient
  ): TClient | Prisma.TransactionClient {
    return context?.tx ?? defaultClient;
  }
}
