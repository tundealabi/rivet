import { OrganizationMember } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";

import { DomainError } from "@/common/errors";
import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";

import { OrgMemberRepository } from "./org-member.repository";
import {
  CreateOrgMemberInput,
  FindByOrgAndUserInput,
} from "./org-member.types";

@Injectable()
export class OrgMemberService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly orgMemberRepository: OrgMemberRepository
  ) {}

  async create(
    input: CreateOrgMemberInput,
    options?: DbOptions
  ): Promise<OrganizationMember> {
    try {
      return await this.orgMemberRepository.create(input, options);
    } catch (err) {
      if (
        this.databaseService.isUniqueConstraintViolationError(
          err,
          "organizationId_userId"
        )
      ) {
        throw new DomainError(
          "CONFLICT",
          ErrorCode.ORG_MEMBER_ALREADY_EXISTS,
          ErrorMessage.ORG_MEMBER_ALREADY_EXISTS
        );
      }
      throw err;
    }
  }

  async findByOrgAndUser(
    input: FindByOrgAndUserInput,
    options?: DbOptions
  ): Promise<OrganizationMember | null> {
    return this.orgMemberRepository.find(
      {
        organizationId_userId: {
          organizationId: input.orgId,
          userId: input.userId,
        },
      },
      options
    );
  }
}
