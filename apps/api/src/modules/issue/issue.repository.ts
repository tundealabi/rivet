import { Injectable } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

import { DB_PRISMA_ERROR_CODES } from "@/database/database.contants";
import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import {
  IssueActivityCreateManyArgs,
  IssueCreateArgs,
  IssueFindFirstArgs,
  IssueFindManyArgs,
  IssueFindUniqueArgs,
  IssueGroupByArgs,
  IssueUpdateArgs,
  IssueUpdateManyArgs,
} from "@/generated/prisma/models";

@Injectable()
export class IssueRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create<T extends IssueCreateArgs>(args: T, dbOptions?: DbOptions) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.issue.create(args);
  }

  async findFirst<T extends IssueFindFirstArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.issue.findFirst(args);
  }

  async findMany<T extends IssueFindManyArgs>(args?: T, dbOptions?: DbOptions) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.issue.findMany(args);
  }

  async findUnique<T extends IssueFindUniqueArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.issue.findUnique(args);
  }

  async groupBy(args: IssueGroupByArgs, dbOptions?: DbOptions) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.issue.groupBy(args as never);
  }

  async update<T extends IssueUpdateArgs>(args: T, dbOptions?: DbOptions) {
    try {
      const client = this.databaseService.resolveClient(dbOptions);
      return await client.issue.update(args);
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === DB_PRISMA_ERROR_CODES.NOT_FOUND) {
          return null;
        }
      }
      throw err;
    }
  }

  async updateMany<T extends IssueUpdateManyArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.issue.updateMany(args);
  }

  async createManyActivity<T extends IssueActivityCreateManyArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.issueActivity.createMany(args);
  }
}
