import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import {
  OrganizationMemberCreateArgs,
  OrganizationMemberFindManyArgs,
  OrganizationMemberFindUniqueArgs,
} from "@/generated/prisma/models";

@Injectable()
export class OrgMemberRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create<T extends OrganizationMemberCreateArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.organizationMember.create(args);
  }

  async findUnique<T extends OrganizationMemberFindUniqueArgs>(
    args: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.organizationMember.findUnique(args);
  }

  async findMany<T extends OrganizationMemberFindManyArgs>(
    args?: T,
    dbOptions?: DbOptions
  ) {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.organizationMember.findMany(args);
  }
}
