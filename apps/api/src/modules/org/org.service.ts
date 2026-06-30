import { Organization } from "@generated/prisma";
import { Injectable } from "@nestjs/common";

import { OrgRepository } from "./org.repository";
import { CreateOrgInput } from "./org.types";

@Injectable()
export class OrgService {
  constructor(private readonly orgRepository: OrgRepository) {}

  async create(input: CreateOrgInput): Promise<Organization> {
    return this.orgRepository.create(input);
  }
}
