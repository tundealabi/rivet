import { Organization } from "@generated/prisma";
import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";

import { CreateOrgInput } from "./org.types";

@Injectable()
export class OrgRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    input: CreateOrgInput,
    options?: DbOptions
  ): Promise<Organization> {
    const client = this.databaseService.resolveClient(options);
    return client.organization.create({
      data: {
        name: input.name,
      },
    });
  }
}
