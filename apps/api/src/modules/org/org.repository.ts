import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import {
  OrganizationCreateArgs,
  OrganizationFindManyArgs,
  OrganizationFindUniqueArgs,
  OrganizationUpdateArgs,
} from "@/generated/prisma/models";

@Injectable()
export class OrgRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create<T extends OrganizationCreateArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.organization.create(args);
  }

  async findMany<T extends OrganizationFindManyArgs>(
    args?: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.organization.findMany(args);
  }

  async findUnique<T extends OrganizationFindUniqueArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.organization.findUnique(args);
  }

  async update<T extends OrganizationUpdateArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.organization.update(args);
  }
}
