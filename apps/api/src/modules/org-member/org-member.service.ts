import { OrganizationMember, Prisma } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";

import { DomainError } from "@/common/errors";
import { DatabaseService } from "@/database/database.service";

import { OrgMemberRepository } from "./org-member.repository";
import { CreateOrgMemberInput } from "./org-member.types";

@Injectable()
export class OrgMemberService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly orgMemberRepository: OrgMemberRepository
  ) {}

  async create(input: CreateOrgMemberInput): Promise<OrganizationMember> {
    const runCreate = async (tx: Prisma.TransactionClient) => {
      const existing = await this.orgMemberRepository.findByUserIdAndOrgId({
        userId: input.userId,
        orgId: input.orgId,
        ctx: { tx },
      });
      if (existing) {
        throw new DomainError(
          "CONFLICT",
          ErrorCode.ORG_MEMBER_ALREADY_EXISTS,
          ErrorMessage.ORG_MEMBER_ALREADY_EXISTS
        );
      }
      return this.orgMemberRepository.create({
        ...input,
        ctx: { tx },
      });
    };
    try {
      if (input.ctx?.tx) {
        return await runCreate(input.ctx.tx);
      }
      return await this.databaseService.client.$transaction(runCreate);
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
}
