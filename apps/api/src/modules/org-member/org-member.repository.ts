import { OrganizationMember } from "@generated/prisma";
import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";

import {
  CreateOrgMemberInput,
  FindOrgMemberByUserIdAndOrgIdInput,
} from "./org-member.types";

@Injectable()
export class OrgMemberRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    input: CreateOrgMemberInput,
    options?: DbOptions
  ): Promise<OrganizationMember> {
    const client = this.databaseService.resolveClient(options);
    return client.organizationMember.create({
      data: {
        organizationId: input.orgId,
        role: input.role,
        userId: input.userId,
      },
    });
  }

  async findByUserIdAndOrgId(
    input: FindOrgMemberByUserIdAndOrgIdInput,
    options?: DbOptions
  ): Promise<OrganizationMember | null> {
    const client = this.databaseService.resolveClient(options);
    return client.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: input.orgId,
          userId: input.userId,
        },
      },
    });
  }
}
