import { OrganizationMember } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { CURSOR_PAGINATION_MAX_LIMIT } from "@rivet/shared/constants";
import {
  ErrorCode,
  ErrorMessage,
  OrganizationRole as SharedOrganizationRole,
} from "@rivet/shared/enums";

import { DomainError } from "@/common/errors";
import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import { Prisma } from "@/generated/prisma/client";

import { OrgMemberRepository } from "./org-member.repository";
import {
  CreateOrgMemberInput,
  FindByOrgAndEmailInput,
  FindByOrgAndEmailsInput,
  FindByOrgAndUserInput,
  ListMembersInOrgInput,
  ListMembersInOrgResult,
  ListOrganizationsForUserInput,
  ListOrganizationsForUserResult,
  UserOrganizationItem,
} from "./org-member.types";

type OrganizationMemberWithOrganization = Prisma.OrganizationMemberGetPayload<{
  include: {
    organization: {
      include: {
        _count: {
          select: {
            members: true;
          };
        };
      };
    };
  };
}>;

type OrganizationMemberWithUser = Prisma.OrganizationMemberGetPayload<{
  include: {
    user: {
      select: {
        email: true;
        firstName: true;
        id: true;
        lastName: true;
      };
    };
  };
}>;

type OrganizationMemberWithEmail = Prisma.OrganizationMemberGetPayload<{
  include: {
    user: {
      select: { email: true };
    };
  };
}>;

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
      return await this.orgMemberRepository.create(
        {
          data: {
            organizationId: input.orgId,
            role: input.role,
            userId: input.userId,
          },
        },
        options
      );
    } catch (err) {
      if (
        err instanceof Error &&
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

  async findByOrgAndUser(input: FindByOrgAndUserInput, options?: DbOptions) {
    return await this.orgMemberRepository.findUnique(
      {
        where: {
          organizationId_userId: {
            organizationId: input.orgId,
            userId: input.userId,
          },
        },
      },
      options
    );
  }

  async findByOrgAndEmail(
    input: FindByOrgAndEmailInput,
    options?: DbOptions
  ): Promise<OrganizationMember | null> {
    return this.orgMemberRepository.findFirst(
      {
        where: {
          organizationId: input.orgId,
          user: {
            email: {
              equals: input.email.trim().toLowerCase(),
              mode: "insensitive",
            },
          },
        },
      },
      options
    );
  }

  async findByOrgAndEmails(
    input: FindByOrgAndEmailsInput,
    options?: DbOptions
  ): Promise<{ email: string }[]> {
    const emails = [
      ...new Set(input.emails.map((email) => email.trim().toLowerCase())),
    ];

    if (emails.length === 0) {
      return [];
    }

    const members = (await this.orgMemberRepository.findMany(
      {
        include: {
          user: {
            select: { email: true },
          },
        },
        where: {
          organizationId: input.orgId,
          user: {
            email: {
              in: emails,
              mode: "insensitive",
            },
          },
        },
      },
      options
    )) as OrganizationMemberWithEmail[];

    return members.map((member) => ({
      email: member.user.email,
    }));
  }

  async countInOrg(orgId: string, options?: DbOptions): Promise<number> {
    return this.orgMemberRepository.count(
      { where: { organizationId: orgId } },
      options
    );
  }

  async listOrganizationsForUser(
    input: ListOrganizationsForUserInput,
    options?: DbOptions
  ): Promise<ListOrganizationsForUserResult> {
    const memberships = (await this.orgMemberRepository.findMany(
      {
        include: {
          organization: {
            include: {
              _count: {
                select: {
                  members: true,
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: CURSOR_PAGINATION_MAX_LIMIT,
        where: {
          userId: input.userId,
        },
      },
      options
    )) as OrganizationMemberWithOrganization[];

    return {
      items: memberships.map((membership) => ({
        memberCount: membership.organization._count.members,
        orgId: membership.organizationId,
        orgName: membership.organization.name,
        role: membership.role as UserOrganizationItem["role"],
      })),
    };
  }

  async listMembersInOrg(
    input: ListMembersInOrgInput,
    options?: DbOptions
  ): Promise<ListMembersInOrgResult> {
    const { after, limit, orgId, q } = input;

    const memberships = (await this.orgMemberRepository.findMany(
      {
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              id: true,
              lastName: true,
            },
          },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: limit + 1,
        where: {
          organizationId: orgId,
          ...(q
            ? {
                user: {
                  OR: [
                    { email: { contains: q, mode: "insensitive" } },
                    { firstName: { contains: q, mode: "insensitive" } },
                    { lastName: { contains: q, mode: "insensitive" } },
                  ],
                },
              }
            : {}),
          ...(after
            ? {
                OR: [
                  { createdAt: { gt: after.createdAt } },
                  {
                    AND: [
                      { createdAt: after.createdAt },
                      { id: { gt: after.id } },
                    ],
                  },
                ],
              }
            : {}),
        },
      },
      options
    )) as OrganizationMemberWithUser[];

    const hasMore = memberships.length > limit;
    const page = hasMore ? memberships.slice(0, limit) : memberships;
    const lastItem = page.at(-1);

    return {
      items: page.map((membership) => ({
        email: membership.user.email,
        firstName: membership.user.firstName,
        id: membership.user.id,
        lastName: membership.user.lastName,
        role: membership.role as SharedOrganizationRole,
      })),
      next:
        hasMore && lastItem
          ? {
              createdAt: lastItem.createdAt,
              id: lastItem.id,
            }
          : undefined,
    };
  }
}
