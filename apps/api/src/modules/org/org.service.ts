import { Organization } from "@generated/prisma";
import { Injectable } from "@nestjs/common";

import { DbOptions } from "@/database/database.types";

import { OrgRepository } from "./org.repository";
import { CreateOrgInput } from "./org.types";

@Injectable()
export class OrgService {
  constructor(private readonly orgRepository: OrgRepository) {}

  async create(
    input: CreateOrgInput,
    options?: DbOptions
  ): Promise<Organization> {
    return this.orgRepository.create(input, options);
  }
}
