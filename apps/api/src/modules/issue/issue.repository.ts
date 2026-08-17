import { Injectable } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

import { DB_PRISMA_ERROR_CODES } from "@/database/database.contants";
import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import { Prisma } from "@/generated/prisma/client";
import {
  IssueActivityCreateManyArgs,
  IssueCommentCreateArgs,
  IssueCommentDeleteArgs,
  IssueCommentFindFirstArgs,
  IssueCommentFindManyArgs,
  IssueCommentUpdateArgs,
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

  async createComment<T extends IssueCommentCreateArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.issueComment.create(args);
  }

  async countComment(
    args: { where: Prisma.IssueCommentWhereInput },
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.issueComment.count(args);
  }

  async findFirstComment<T extends IssueCommentFindFirstArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.issueComment.findFirst(args);
  }

  async findManyComment<T extends IssueCommentFindManyArgs>(
    args?: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.issueComment.findMany(args);
  }

  async updateComment<T extends IssueCommentUpdateArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    try {
      const client = this.databaseService.resolveClient(dbOptions);
      return await client.issueComment.update(args);
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === DB_PRISMA_ERROR_CODES.NOT_FOUND) {
          return null;
        }
      }
      throw err;
    }
  }

  async deleteComment<T extends IssueCommentDeleteArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    try {
      const client = this.databaseService.resolveClient(dbOptions);
      return await client.issueComment.delete(args);
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
