import { Injectable } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

import { DB_PRISMA_ERROR_CODES } from "@/database/database.contants";
import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import {
  ExportJobCreateArgs,
  ExportJobFindUniqueArgs,
  ExportJobUpdateArgs,
} from "@/generated/prisma/models";

@Injectable()
export class ExportRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create<T extends ExportJobCreateArgs>(args: T, dbOptions?: DbOptions) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.exportJob.create(args);
  }

  async count(
    args: Parameters<
      ReturnType<DatabaseService["resolveClient"]>["exportJob"]["count"]
    >[0],
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.exportJob.count(args);
  }

  async findUnique<T extends ExportJobFindUniqueArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.exportJob.findUnique(args);
  }

  async update<T extends ExportJobUpdateArgs>(args: T, dbOptions?: DbOptions) {
    try {
      const client = this.databaseService.resolveClient(dbOptions);
      return await client.exportJob.update(args);
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === DB_PRISMA_ERROR_CODES.NOT_FOUND) {
          return null;
        }
      }
      throw err;
    }
  }
}
