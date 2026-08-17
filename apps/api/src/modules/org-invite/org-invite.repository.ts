import { Injectable } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

import { DB_PRISMA_ERROR_CODES } from "@/database/database.contants";
import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import { Prisma } from "@/generated/prisma/client";
import {
  OrganizationInviteCreateArgs,
  OrganizationInviteFindFirstArgs,
  OrganizationInviteFindManyArgs,
  OrganizationInviteFindUniqueArgs,
  OrganizationInviteUpdateArgs,
} from "@/generated/prisma/models";

@Injectable()
export class OrgInviteRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create<T extends OrganizationInviteCreateArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.organizationInvite.create(args);
  }

  async count(
    args: { where: Prisma.OrganizationInviteWhereInput },
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.organizationInvite.count(args);
  }

  async findUnique<T extends OrganizationInviteFindUniqueArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.organizationInvite.findUnique(args);
  }

  async findFirst<T extends OrganizationInviteFindFirstArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.organizationInvite.findFirst(args);
  }

  async findMany<T extends OrganizationInviteFindManyArgs>(
    args?: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.organizationInvite.findMany(args);
  }

  async update<T extends OrganizationInviteUpdateArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    try {
      const client = this.databaseService.resolveClient(dbOptions);
      return await client.organizationInvite.update(args);
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === DB_PRISMA_ERROR_CODES.NOT_FOUND) {
          return null;
        }
      }
      throw err;
    }
  }

  async updateMany(
    args: {
      data: Prisma.OrganizationInviteUpdateManyMutationInput;
      where: Prisma.OrganizationInviteWhereInput;
    },
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.organizationInvite.updateMany(args);
  }
}
