import { Prisma, PrismaClient } from "@generated/prisma";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { ENV_KEYS } from "@/common/constants";

import { DbOptions } from "./database.types";

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

    const fields = this.getUniqueConstraintFields(error);
    return fields.includes(field);
  }

  resolveClient(options?: DbOptions): PrismaClient | Prisma.TransactionClient {
    return options?.tx ?? this.client;
  }

  private getUniqueConstraintFields(
    error: Prisma.PrismaClientKnownRequestError
  ): string[] {
    const meta = error.meta as
      | {
          driverAdapterError?: {
            cause?: {
              constraint?: {
                fields?: string[];
              };
            };
          };
        }
      | undefined;

    const fields = meta?.driverAdapterError?.cause?.constraint?.fields;

    return Array.isArray(fields) ? fields : [];
  }
}
