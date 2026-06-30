import { Organization } from "@generated/prisma";
import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@/database/database.service";

import { CreateOrgInput } from "./org.types";

@Injectable()
export class OrgRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateOrgInput): Promise<Organization> {
    const client = this.databaseService.resolveClient(
      input.ctx,
      this.databaseService.client
    );
    return client.organization.create({
      data: {
        name: input.name,
      },
    });
  }
}
