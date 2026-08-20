import { OrganizationInvite, OrganizationRole } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import type {
  AcceptInvitationResponseWire,
  InvitationPreviewResponseWire,
  OrganizationInviteCreatedResponseWire,
  OrganizationInviteInviterWire,
  OrganizationInviteResponseWire,
  OrganizationMemberResponseWire,
  UserInvitationResponseWire,
  UserOrganizationResponseWire,
} from "@rivet/shared/api";
import { INVITE_TTL_DAYS, PLAN_LIMITS } from "@rivet/shared/constants";
import {
  ErrorCode,
  ErrorMessage,
  OrganizationInviteStatus,
  PlanTier,
} from "@rivet/shared/enums";
import { DATE_UTILS } from "@rivet/shared/utils";
import { ZodError } from "zod";

import { DomainError, ValidationError } from "@/common/errors";
import { Helpers } from "@/common/helpers";
import {
  HashService,
  TenantContextService,
  TokenService,
} from "@/common/services";
import type { PaginatedResult } from "@/common/types";
import { DatabaseService } from "@/database/database.service";
import type { DbOptions } from "@/database/database.types";
import { OrgService } from "@/modules/org/org.service";
import { OrgInviteService } from "@/modules/org-invite/org-invite.service";
import type {
  OrganizationInviteWithInviter,
  OrganizationInviteWithOrganization,
} from "@/modules/org-invite/org-invite.types";
import { OrgMemberService } from "@/modules/org-member/org-member.service";
import { UserService } from "@/modules/user/user.service";
import { Metrics } from "@/observability";

import {
  OrgInvitesListCursorSchema,
  OrgMembersListCursorSchema,
} from "./organization.constants";
import {
  AcceptInvitationInput,
  CreateOrganizationInput,
  CreateOrganizationInvitesInput,
  DeclineInvitationInput,
  ListOrganizationInvitesInput,
  ListOrganizationMembersInput,
  ListUserInvitationsInput,
  PreviewInvitationInput,
  ResendOrganizationInviteInput,
  RevokeOrganizationInviteInput,
} from "./organization.types";

@Injectable()
export class OrganizationService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly hashService: HashService,
    private readonly orgInviteService: OrgInviteService,
    private readonly orgMemberService: OrgMemberService,
    private readonly orgService: OrgService,
    private readonly tenantContext: TenantContextService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService
  ) {}

  async getUserOrganizations(
    userId: string
  ): Promise<UserOrganizationResponseWire[]> {
    const result = await this.orgMemberService.listOrganizationsForUser({
      userId,
    });

    return result.items;
  }

  async createOrganization(
    input: CreateOrganizationInput
  ): Promise<UserOrganizationResponseWire> {
    return this.databaseService.client.$transaction(async (tx) => {
      const options = { tx };
      const organization = await this.orgService.create(
        { name: input.name },
        options
      );
      await this.orgMemberService.create(
        {
          orgId: organization.id,
          role: OrganizationRole.OWNER,
          userId: input.userId,
        },
        options
      );

      return {
        memberCount: 1,
        orgId: organization.id,
        orgName: organization.name,
        role: OrganizationRole.OWNER as UserOrganizationResponseWire["role"],
      };
    });
  }

  async listMembers(
    input: ListOrganizationMembersInput
  ): Promise<PaginatedResult<OrganizationMemberResponseWire>> {
    const after = this.decodeCursor(
      input.pagination.cursor,
      OrgMembersListCursorSchema
    );

    const result = await this.orgMemberService.listMembersInOrg({
      after: after
        ? {
            createdAt: new Date(after.createdAt),
            id: after.id,
          }
        : undefined,
      limit: input.pagination.limit,
      orgId: this.tenantContext.orgId,
      q: input.q,
    });

    return Helpers.toCursorPaginatedResult(
      {
        items: result.items,
        nextCursor: result.next
          ? Helpers.encodePaginationCursor({
              createdAt: result.next.createdAt.toISOString(),
              id: result.next.id,
            })
          : null,
      },
      input.pagination
    );
  }

  async createInvites(
    input: CreateOrganizationInvitesInput
  ): Promise<OrganizationInviteCreatedResponseWire[]> {
    const organizationId = this.tenantContext.orgId;
    const invitedById = this.tenantContext.userId;

    return this.databaseService.client.$transaction(async (tx) => {
      const options = { tx };

      const emails = await this.emailsNotAlreadyMembers(
        organizationId,
        input.emails,
        options
      );
      await this.assertNoPendingInvites(organizationId, emails, options);
      await this.assertWithinMemberLimit(
        organizationId,
        emails.length,
        options
      );

      const { expiresAt, lastSentAt } = this.issuedInviteDates();
      const invitedBy = await this.toInviter(invitedById, options);

      const created: OrganizationInviteCreatedResponseWire[] = [];

      for (const email of emails) {
        const token = this.tokenService.generateOpaqueToken();
        const invite = await this.orgInviteService.create(
          {
            email,
            expiresAt,
            invitedById,
            lastSentAt,
            orgId: organizationId,
            role: input.role,
            tokenHash: this.hashService.digest(token),
          },
          options
        );

        created.push(this.toCreatedResponse(invite, invitedBy, token));
      }

      return created;
    });
  }

  async listInvites(
    input: ListOrganizationInvitesInput
  ): Promise<PaginatedResult<OrganizationInviteResponseWire>> {
    const after = this.decodeCursor(
      input.pagination.cursor,
      OrgInvitesListCursorSchema
    );

    const result = await this.orgInviteService.listOpenInOrg({
      after: after
        ? {
            createdAt: new Date(after.createdAt),
            id: after.id,
          }
        : undefined,
      limit: input.pagination.limit,
      orgId: this.tenantContext.orgId,
    });

    return Helpers.toCursorPaginatedResult(
      {
        items: result.items.map((invite) => this.toListResponse(invite)),
        nextCursor: result.next
          ? Helpers.encodePaginationCursor({
              createdAt: result.next.createdAt.toISOString(),
              id: result.next.id,
            })
          : null,
      },
      input.pagination
    );
  }

  async resendInvite(
    input: ResendOrganizationInviteInput
  ): Promise<OrganizationInviteCreatedResponseWire> {
    const organizationId = this.tenantContext.orgId;

    return this.databaseService.client.$transaction(async (tx) => {
      const options = { tx };

      const invite = await this.orgInviteService.findByOrgAndId(
        { id: input.id, orgId: organizationId },
        options
      );

      if (!invite || !this.orgInviteService.isOpen(invite)) {
        throw new DomainError(
          "NOT_FOUND",
          ErrorCode.ORG_INVITE_NOT_FOUND,
          ErrorMessage.ORG_INVITE_NOT_FOUND
        );
      }

      if (this.orgInviteService.isExpired(invite)) {
        const pending = await this.orgInviteService.findActiveByOrgAndEmail(
          { email: invite.email, orgId: organizationId },
          options
        );

        if (pending && pending.id !== invite.id) {
          throw new DomainError(
            "CONFLICT",
            ErrorCode.ORG_INVITE_ALREADY_PENDING,
            ErrorMessage.ORG_INVITE_ALREADY_PENDING
          );
        }

        await this.assertWithinMemberLimit(organizationId, 1, options);
      }

      const token = this.tokenService.generateOpaqueToken();
      const { expiresAt, lastSentAt } = this.issuedInviteDates();

      const rotated = await this.orgInviteService.rotateToken(
        {
          expiresAt,
          id: invite.id,
          lastSentAt,
          orgId: organizationId,
          tokenHash: this.hashService.digest(token),
        },
        options
      );

      const invitedBy = await this.toInviter(rotated.invitedById, options);

      return this.toCreatedResponse(rotated, invitedBy, token);
    });
  }

  async revokeInvite(input: RevokeOrganizationInviteInput): Promise<null> {
    await this.orgInviteService.revoke({
      id: input.id,
      orgId: this.tenantContext.orgId,
      revokedAt: DATE_UTILS.toJSDate(DATE_UTILS.nowUtc()),
    });

    return null;
  }

  async listUserInvitations(
    input: ListUserInvitationsInput
  ): Promise<PaginatedResult<UserInvitationResponseWire>> {
    const user = await this.requireUser(input.userId);
    const after = this.decodeCursor(
      input.pagination.cursor,
      OrgInvitesListCursorSchema
    );

    const result = await this.orgInviteService.listPendingForEmail({
      after: after
        ? {
            createdAt: new Date(after.createdAt),
            id: after.id,
          }
        : undefined,
      email: this.normalizeEmail(user.email),
      limit: input.pagination.limit,
    });

    return Helpers.toCursorPaginatedResult(
      {
        items: result.items.map((invite) =>
          this.toUserInvitationResponse(invite)
        ),
        nextCursor: result.next
          ? Helpers.encodePaginationCursor({
              createdAt: result.next.createdAt.toISOString(),
              id: result.next.id,
            })
          : null,
      },
      input.pagination
    );
  }

  async previewInvitation(
    input: PreviewInvitationInput
  ): Promise<InvitationPreviewResponseWire> {
    const invite = await this.orgInviteService.findActiveByTokenHash({
      tokenHash: this.hashService.digest(input.token),
    });

    if (!invite) {
      this.inviteNotFound();
    }

    const organization = await this.orgService.findById(invite.organizationId);

    if (!organization) {
      this.inviteNotFound();
    }

    return {
      orgName: organization.name,
      role: invite.role as InvitationPreviewResponseWire["role"],
    };
  }

  async acceptInvitation(
    input: AcceptInvitationInput
  ): Promise<AcceptInvitationResponseWire> {
    const user = await this.requireUser(input.userId);

    const result = await this.databaseService.client.$transaction(
      async (tx) => {
        const options = { tx };
        const invite = await this.loadInviteForAccept(input, options);

        this.assertInviteeEmail(user.email, invite.email);

        const existing = await this.orgMemberService.findByOrgAndUser(
          { orgId: invite.organizationId, userId: user.id },
          options
        );

        if (existing) {
          await this.consumeInviteIfActive(invite.id, options);
          return { kind: "already_member" as const };
        }

        if (!this.orgInviteService.isActive(invite)) {
          this.inviteNotFound();
        }

        await this.orgInviteService.consume(
          {
            acceptedAt: DATE_UTILS.toJSDate(DATE_UTILS.nowUtc()),
            id: invite.id,
          },
          options
        );
        await this.assertWithinMemberLimit(invite.organizationId, 1, options);
        await this.orgMemberService.create(
          {
            orgId: invite.organizationId,
            role: invite.role,
            userId: user.id,
          },
          options
        );

        const organization = await this.orgService.findById(
          invite.organizationId,
          options
        );

        if (!organization) {
          this.inviteNotFound();
        }

        return {
          kind: "joined" as const,
          orgId: organization.id,
          orgName: organization.name,
          role: invite.role as AcceptInvitationResponseWire["role"],
        };
      }
    );

    if (result.kind === "already_member") {
      throw new DomainError(
        "CONFLICT",
        ErrorCode.ORG_MEMBER_ALREADY_EXISTS,
        ErrorMessage.ORG_MEMBER_ALREADY_EXISTS
      );
    }

    return {
      orgId: result.orgId,
      orgName: result.orgName,
      role: result.role,
    };
  }

  async declineInvitation(input: DeclineInvitationInput): Promise<null> {
    const user = await this.requireUser(input.userId);
    const invite = await this.orgInviteService.findById({ id: input.id });

    if (!invite) {
      this.inviteNotFound();
    }

    this.assertInviteeEmail(user.email, invite.email);

    await this.orgInviteService.decline({
      declinedAt: DATE_UTILS.toJSDate(DATE_UTILS.nowUtc()),
      id: invite.id,
    });

    return null;
  }

  private async emailsNotAlreadyMembers(
    organizationId: string,
    emails: string[],
    options?: DbOptions
  ): Promise<string[]> {
    const members = await this.orgMemberService.findByOrgAndEmails(
      { emails, orgId: organizationId },
      options
    );
    const alreadyMemberEmails = new Set(
      members.map((member) => member.email.trim().toLowerCase())
    );
    const alreadyMembers = emails.filter((email) =>
      alreadyMemberEmails.has(email)
    );
    const toInvite = emails.filter((email) => !alreadyMemberEmails.has(email));

    if (toInvite.length === 0) {
      throw new DomainError(
        "CONFLICT",
        ErrorCode.ORG_MEMBER_ALREADY_EXISTS,
        ErrorMessage.ORG_MEMBER_ALREADY_EXISTS,
        { emails: alreadyMembers }
      );
    }

    return toInvite;
  }

  private async assertNoPendingInvites(
    organizationId: string,
    emails: string[],
    options?: DbOptions
  ): Promise<void> {
    const pending = await this.orgInviteService.findActiveByOrgAndEmails(
      { emails, orgId: organizationId },
      options
    );

    if (pending.length === 0) {
      return;
    }

    throw new DomainError(
      "CONFLICT",
      ErrorCode.ORG_INVITE_ALREADY_PENDING,
      ErrorMessage.ORG_INVITE_ALREADY_PENDING,
      { emails: pending.map((invite) => invite.email) }
    );
  }

  private async assertWithinMemberLimit(
    organizationId: string,
    additionalSeats: number,
    options?: DbOptions
  ): Promise<void> {
    const organization = await this.orgService.findById(
      organizationId,
      options
    );

    if (!organization) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    const limit = PLAN_LIMITS[organization.planTier as PlanTier].members;

    if (limit === null) {
      return;
    }

    const memberCount = await this.orgMemberService.countInOrg(
      organizationId,
      options
    );
    const activeInviteCount = await this.orgInviteService.countActiveInOrg(
      { orgId: organizationId },
      options
    );

    if (memberCount + activeInviteCount + additionalSeats > limit) {
      Metrics.recordQuotaRejection("members");
      throw new DomainError(
        "TOO_MANY_REQUESTS",
        ErrorCode.ORG_MEMBER_LIMIT_EXCEEDED,
        ErrorMessage.ORG_MEMBER_LIMIT_EXCEEDED
      );
    }
  }

  private async toInviter(
    userId: string | null,
    options?: DbOptions
  ): Promise<OrganizationInviteInviterWire | null> {
    if (!userId) {
      return null;
    }

    const user = await this.userService.findById(userId, options);

    if (!user) {
      return null;
    }

    return {
      firstName: user.firstName,
      id: user.id,
      lastName: user.lastName,
    };
  }

  private issuedInviteDates(): { expiresAt: Date; lastSentAt: Date } {
    const now = DATE_UTILS.nowUtc();

    return {
      expiresAt: DATE_UTILS.toJSDate(DATE_UTILS.addDays(now, INVITE_TTL_DAYS)),
      lastSentAt: DATE_UTILS.toJSDate(now),
    };
  }

  private toListResponse(
    invite: OrganizationInviteWithInviter
  ): OrganizationInviteResponseWire {
    return this.toInviteResponse(invite, this.toInviterWire(invite.invitedBy));
  }

  private toCreatedResponse(
    invite: OrganizationInvite,
    invitedBy: OrganizationInviteInviterWire | null,
    token: string
  ): OrganizationInviteCreatedResponseWire {
    return {
      ...this.toInviteResponse(invite, invitedBy),
      token,
    };
  }

  private toInviteResponse(
    invite: OrganizationInvite,
    invitedBy: OrganizationInviteInviterWire | null
  ): OrganizationInviteResponseWire {
    return {
      createdAt: invite.createdAt.toISOString(),
      email: invite.email,
      expiresAt: invite.expiresAt.toISOString(),
      id: invite.id,
      invitedBy,
      role: invite.role as OrganizationInviteResponseWire["role"],
      sentAt: invite.lastSentAt.toISOString(),
      status: this.orgInviteService.isExpired(invite)
        ? OrganizationInviteStatus.EXPIRED
        : OrganizationInviteStatus.PENDING,
    };
  }

  private toInviterWire(
    invitedBy: OrganizationInviteInviterWire | null
  ): OrganizationInviteInviterWire | null {
    if (!invitedBy) {
      return null;
    }

    return {
      firstName: invitedBy.firstName,
      id: invitedBy.id,
      lastName: invitedBy.lastName,
    };
  }

  private decodeCursor(
    cursor: string | undefined,
    schema:
      typeof OrgMembersListCursorSchema | typeof OrgInvitesListCursorSchema
  ) {
    if (!cursor) {
      return undefined;
    }

    try {
      return Helpers.decodePaginationCursor(cursor, schema);
    } catch (err) {
      if (err instanceof ZodError || err instanceof SyntaxError) {
        throw new ValidationError({
          cursor: [{ message: "Invalid cursor" }],
        });
      }
      throw err;
    }
  }

  private async requireUser(userId: string) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    return user;
  }

  private async loadInviteForAccept(
    input: { id: string } | { token: string },
    options?: DbOptions
  ): Promise<OrganizationInvite> {
    if ("token" in input) {
      const invite = await this.orgInviteService.findActiveByTokenHash(
        { tokenHash: this.hashService.digest(input.token) },
        options
      );

      if (!invite) {
        this.inviteNotFound();
      }

      return invite;
    }

    const invite = await this.orgInviteService.findById(
      { id: input.id },
      options
    );

    if (!invite) {
      this.inviteNotFound();
    }

    return invite;
  }

  private assertInviteeEmail(userEmail: string, inviteEmail: string): void {
    if (this.normalizeEmail(userEmail) !== this.normalizeEmail(inviteEmail)) {
      throw new DomainError(
        "FORBIDDEN",
        ErrorCode.FORBIDDEN,
        ErrorMessage.FORBIDDEN
      );
    }
  }

  private async consumeInviteIfActive(
    id: string,
    options?: DbOptions
  ): Promise<void> {
    try {
      await this.orgInviteService.consume(
        {
          acceptedAt: DATE_UTILS.toJSDate(DATE_UTILS.nowUtc()),
          id,
        },
        options
      );
    } catch (err) {
      if (err instanceof DomainError && err.kind === "NOT_FOUND") {
        return;
      }
      throw err;
    }
  }

  private toUserInvitationResponse(
    invite: OrganizationInviteWithOrganization
  ): UserInvitationResponseWire {
    return {
      expiresAt: invite.expiresAt.toISOString(),
      id: invite.id,
      invitedByName: invite.invitedBy
        ? `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}`.trim()
        : null,
      orgId: invite.organization.id,
      orgName: invite.organization.name,
      role: invite.role as UserInvitationResponseWire["role"],
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private inviteNotFound(): never {
    throw new DomainError(
      "NOT_FOUND",
      ErrorCode.ORG_INVITE_NOT_FOUND,
      ErrorMessage.ORG_INVITE_NOT_FOUND
    );
  }
}
