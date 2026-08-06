import { Injectable } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

import { DB_PRISMA_ERROR_CODES } from "@/database/database.contants";
import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import {
  ProjectCreateArgs,
  ProjectFindFirstArgs,
  ProjectFindManyArgs,
  ProjectFindUniqueArgs,
  ProjectUpdateArgs,
} from "@/generated/prisma/models";

@Injectable()
export class ProjectRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create<T extends ProjectCreateArgs>(args: T, dbOptions?: DbOptions) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.project.create(args);
  }

  async findUnique<T extends ProjectFindUniqueArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.project.findUnique(args);
  }

  async findMany<T extends ProjectFindManyArgs>(
    args?: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.project.findMany(args);
  }

  async findFirst<T extends ProjectFindFirstArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.project.findFirst(args);
  }

  async update<T extends ProjectUpdateArgs>(args: T, dbOptions?: DbOptions) {
    try {
      const client = this.databaseService.resolveClient(dbOptions);
      return await client.project.update(args);
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
