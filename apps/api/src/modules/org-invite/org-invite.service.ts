import { OrganizationInvite, OrganizationRole } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";
import { DATE_UTILS } from "@rivet/shared/utils";

import { DomainError } from "@/common/errors";
import { DbOptions } from "@/database/database.types";
import { Prisma } from "@/generated/prisma/client";

import {
  organizationInviteActiveWhere,
  organizationInviteInviterInclude,
  organizationInviteListOrderBy,
  organizationInviteOpenWhere,
  organizationInviteOrganizationInclude,
} from "./org-invite.constants";
import { OrgInviteRepository } from "./org-invite.repository";
import {
  ConsumeOrgInviteInput,
  CountActiveOrgInvitesInput,
  CreateOrgInviteInput,
  DeclineOrgInviteInput,
  FindActiveOrgInviteByOrgAndEmailInput,
  FindActiveOrgInvitesByOrgAndEmailsInput,
  FindOrgInviteByIdInput,
  FindOrgInviteByOrgAndIdInput,
  FindOrgInviteByTokenHashInput,
  ListOrgInvitesInOrgInput,
  ListOrgInvitesInOrgResult,
  ListPendingOrgInvitesForEmailInput,
  ListPendingOrgInvitesForEmailResult,
  OrganizationInviteWithInviter,
  OrganizationInviteWithOrganization,
  RevokeOrgInviteInput,
  RotateOrgInviteTokenInput,
} from "./org-invite.types";

type InviteLifecycle = Pick<
  OrganizationInvite,
  "acceptedAt" | "declinedAt" | "expiresAt" | "revokedAt"
>;

@Injectable()
export class OrgInviteService {
  constructor(private readonly orgInviteRepository: OrgInviteRepository) {}

  async create(
    input: CreateOrgInviteInput,
    options?: DbOptions
  ): Promise<OrganizationInvite> {
    if (input.role === OrganizationRole.OWNER) {
      throw new DomainError(
        "RULE_VIOLATION",
        ErrorCode.UNPROCESSABLE_ENTITY,
        ErrorMessage.UNPROCESSABLE_ENTITY
      );
    }

    const email = input.email.trim().toLowerCase();

    return this.orgInviteRepository.create(
      {
        data: {
          email,
          expiresAt: input.expiresAt,
          invitedById: input.invitedById,
          lastSentAt: input.lastSentAt,
          organizationId: input.orgId,
          role: input.role,
          tokenHash: input.tokenHash,
        },
      },
      options
    );
  }

  async findById(
    input: FindOrgInviteByIdInput,
    options?: DbOptions
  ): Promise<OrganizationInvite | null> {
    return this.orgInviteRepository.findUnique(
      { where: { id: input.id } },
      options
    );
  }

  async findByOrgAndId(
    input: FindOrgInviteByOrgAndIdInput,
    options?: DbOptions
  ): Promise<OrganizationInvite | null> {
    return this.orgInviteRepository.findFirst(
      {
        where: {
          id: input.id,
          organizationId: input.orgId,
        },
      },
      options
    );
  }

  async findByTokenHash(
    input: FindOrgInviteByTokenHashInput,
    options?: DbOptions
  ): Promise<OrganizationInvite | null> {
    return this.orgInviteRepository.findUnique(
      { where: { tokenHash: input.tokenHash } },
      options
    );
  }

  async findActiveByTokenHash(
    input: FindOrgInviteByTokenHashInput,
    options?: DbOptions
  ): Promise<OrganizationInvite | null> {
    const invite = await this.findByTokenHash(input, options);

    if (!invite || !this.isActive(invite)) {
      return null;
    }

    return invite;
  }

  async findActiveByOrgAndEmail(
    input: FindActiveOrgInviteByOrgAndEmailInput,
    options?: DbOptions
  ): Promise<OrganizationInvite | null> {
    return this.orgInviteRepository.findFirst(
      {
        where: {
          ...organizationInviteActiveWhere(this.now()),
          email: input.email.trim().toLowerCase(),
          organizationId: input.orgId,
        },
      },
      options
    );
  }

  async findActiveByOrgAndEmails(
    input: FindActiveOrgInvitesByOrgAndEmailsInput,
    options?: DbOptions
  ): Promise<OrganizationInvite[]> {
    const emails = [
      ...new Set(input.emails.map((email) => email.trim().toLowerCase())),
    ];

    if (emails.length === 0) {
      return [];
    }

    return this.orgInviteRepository.findMany(
      {
        where: {
          ...organizationInviteActiveWhere(this.now()),
          email: { in: emails },
          organizationId: input.orgId,
        },
      },
      options
    );
  }

  async countActiveInOrg(
    input: CountActiveOrgInvitesInput,
    options?: DbOptions
  ): Promise<number> {
    return this.orgInviteRepository.count(
      {
        where: {
          ...organizationInviteActiveWhere(this.now()),
          organizationId: input.orgId,
        },
      },
      options
    );
  }

  async listOpenInOrg(
    input: ListOrgInvitesInOrgInput,
    options?: DbOptions
  ): Promise<ListOrgInvitesInOrgResult> {
    const { after, limit, orgId } = input;

    const invites = (await this.orgInviteRepository.findMany(
      {
        include: organizationInviteInviterInclude,
        orderBy: [...organizationInviteListOrderBy],
        take: limit + 1,
        where: {
          ...organizationInviteOpenWhere(),
          organizationId: orgId,
          ...this.keysetAfter(after),
        },
      },
      options
    )) as OrganizationInviteWithInviter[];

    return this.toCursorPage(invites, limit);
  }

  async listPendingForEmail(
    input: ListPendingOrgInvitesForEmailInput,
    options?: DbOptions
  ): Promise<ListPendingOrgInvitesForEmailResult> {
    const { after, email, limit } = input;

    const invites = (await this.orgInviteRepository.findMany(
      {
        include: organizationInviteOrganizationInclude,
        orderBy: [...organizationInviteListOrderBy],
        take: limit + 1,
        where: {
          ...organizationInviteActiveWhere(this.now()),
          email: email.trim().toLowerCase(),
          ...this.keysetAfter(after),
        },
      },
      options
    )) as OrganizationInviteWithOrganization[];

    return this.toCursorPage(invites, limit);
  }

  async consume(
    input: ConsumeOrgInviteInput,
    options?: DbOptions
  ): Promise<OrganizationInvite> {
    const result = await this.orgInviteRepository.updateMany(
      {
        data: { acceptedAt: input.acceptedAt },
        where: {
          ...organizationInviteActiveWhere(this.now()),
          id: input.id,
        },
      },
      options
    );

    if (result.count === 0) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.ORG_INVITE_NOT_FOUND,
        ErrorMessage.ORG_INVITE_NOT_FOUND
      );
    }

    return this.requireById(input.id, options);
  }

  async decline(
    input: DeclineOrgInviteInput,
    options?: DbOptions
  ): Promise<OrganizationInvite> {
    const result = await this.orgInviteRepository.updateMany(
      {
        data: { declinedAt: input.declinedAt },
        where: {
          ...organizationInviteActiveWhere(this.now()),
          id: input.id,
        },
      },
      options
    );

    if (result.count === 0) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.ORG_INVITE_NOT_FOUND,
        ErrorMessage.ORG_INVITE_NOT_FOUND
      );
    }

    return this.requireById(input.id, options);
  }

  async revoke(
    input: RevokeOrgInviteInput,
    options?: DbOptions
  ): Promise<OrganizationInvite> {
    const result = await this.orgInviteRepository.updateMany(
      {
        data: { revokedAt: input.revokedAt },
        where: {
          ...organizationInviteOpenWhere(),
          id: input.id,
          organizationId: input.orgId,
        },
      },
      options
    );

    if (result.count === 0) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.ORG_INVITE_NOT_FOUND,
        ErrorMessage.ORG_INVITE_NOT_FOUND
      );
    }

    return this.requireById(input.id, options);
  }

  async rotateToken(
    input: RotateOrgInviteTokenInput,
    options?: DbOptions
  ): Promise<OrganizationInvite> {
    const result = await this.orgInviteRepository.updateMany(
      {
        data: {
          expiresAt: input.expiresAt,
          lastSentAt: input.lastSentAt,
          tokenHash: input.tokenHash,
        },
        where: {
          ...organizationInviteOpenWhere(),
          id: input.id,
          organizationId: input.orgId,
        },
      },
      options
    );

    if (result.count === 0) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.ORG_INVITE_NOT_FOUND,
        ErrorMessage.ORG_INVITE_NOT_FOUND
      );
    }

    return this.requireById(input.id, options);
  }

  private async requireById(
    id: string,
    options?: DbOptions
  ): Promise<OrganizationInvite> {
    const invite = await this.findById({ id }, options);

    if (!invite) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.ORG_INVITE_NOT_FOUND,
        ErrorMessage.ORG_INVITE_NOT_FOUND
      );
    }

    return invite;
  }

  private keysetAfter(
    after?: ListOrgInvitesInOrgInput["after"]
  ): Prisma.OrganizationInviteWhereInput {
    if (!after) {
      return {};
    }

    return {
      OR: [
        { createdAt: { gt: after.createdAt } },
        {
          AND: [{ createdAt: after.createdAt }, { id: { gt: after.id } }],
        },
      ],
    };
  }

  private toCursorPage<T extends { createdAt: Date; id: string }>(
    rows: T[],
    limit: number
  ): { items: T[]; next?: { createdAt: Date; id: string } } {
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const lastItem = page.at(-1);

    return {
      items: page,
      next:
        hasMore && lastItem
          ? {
              createdAt: lastItem.createdAt,
              id: lastItem.id,
            }
          : undefined,
    };
  }

  isOpen(
    invite: Pick<InviteLifecycle, "acceptedAt" | "declinedAt" | "revokedAt">
  ): boolean {
    return (
      invite.acceptedAt === null &&
      invite.declinedAt === null &&
      invite.revokedAt === null
    );
  }

  isActive(invite: InviteLifecycle, now: Date = this.now()): boolean {
    return this.isOpen(invite) && invite.expiresAt.getTime() > now.getTime();
  }

  isExpired(invite: InviteLifecycle, now: Date = this.now()): boolean {
    return this.isOpen(invite) && invite.expiresAt.getTime() <= now.getTime();
  }

  private now(): Date {
    return DATE_UTILS.toJSDate(DATE_UTILS.nowUtc());
  }
}
