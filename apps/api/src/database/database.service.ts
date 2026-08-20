import { Prisma } from "@generated/prisma";
import { PrismaClient } from "@generated/prisma";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { ClsService } from "nestjs-cls";

import {
  TENANT_CONTEXT_KEYS,
  type TenantContextStore,
} from "@/common/constants";
import { ENV_KEYS } from "@/common/constants";

import { DB_PRISMA_ERROR_CODES } from "./database.contants";
import { DbOptions, PlainPrismaClient } from "./database.types";
import {
  AppPrismaClient,
  createTenantScopedClient,
} from "./tenant-prisma.extension";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly _baseClient: PrismaClient;
  private readonly _client: AppPrismaClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly cls: ClsService<TenantContextStore>
  ) {
    this._baseClient = new PrismaClient({
      adapter: new PrismaPg(
        this.configService.getOrThrow(ENV_KEYS.DATABASE_URL)
      ),
    });
    this._client = createTenantScopedClient(this._baseClient, () =>
      this.cls.get(TENANT_CONTEXT_KEYS.orgId)
    );
  }

  async onModuleInit() {
    await this._baseClient.$connect();
  }

  async onModuleDestroy() {
    await this._baseClient.$disconnect();
  }

  get client(): AppPrismaClient {
    return this._client;
  }

  async ping(): Promise<void> {
    await this._baseClient.$queryRawUnsafe("SELECT 1");
  }

  isUniqueConstraintViolationError(error: unknown, field?: string): boolean {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== DB_PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION
    ) {
      return false;
    }

    if (field === undefined) {
      return true;
    }

    return this.getUniqueConstraintFields(error).includes(field);
  }

  resolveClient(options?: DbOptions): PlainPrismaClient {
    return (options?.tx ?? this.client) as unknown as PlainPrismaClient;
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
