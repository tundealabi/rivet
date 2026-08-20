import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OrganizationRole } from "@rivet/shared/enums";

import {
  ApiEnvelopeResponse,
  ApiOrgIdHeader,
  ApiRequestUser,
  RequireOrgRole,
} from "@/common/decorators";
import { OrgMemberGuard, OrgRoleGuard } from "@/common/guards";
import { AuthJwtUser } from "@/modules/auth/auth.entities";
import { AuthUserJwtGuard } from "@/modules/auth/auth.guard";

import {
  CreateOrganizationInvitesRequestDto,
  CreateOrganizationRequestDto,
  ListOrganizationInvitesQueryDto,
  ListOrganizationMembersQueryDto,
  OrganizationInviteCreatedResponseDto,
  OrganizationInviteResponseDto,
  OrganizationMemberResponseDto,
  UserOrganizationResponseDto,
} from "./dto";
import { OrganizationService } from "./organization.service";

@Controller("organizations")
@UseGuards(AuthUserJwtGuard)
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get()
  @ApiEnvelopeResponse(UserOrganizationResponseDto, {
    auth: "required",
    description: "List organizations the authenticated user belongs to",
    httpStatus: HttpStatus.OK,
    isArray: true,
    summary: "List user organizations",
  })
  getUserOrganizations(@ApiRequestUser() user: AuthJwtUser) {
    return this.service.getUserOrganizations(user.sub);
  }

  @Post()
  @ApiEnvelopeResponse(UserOrganizationResponseDto, {
    auth: "required",
    description:
      "Create an organization after signup and make the authenticated user the owner. Does not require X-ORG-ID.",
    httpStatus: HttpStatus.CREATED,
    summary: "Create an organization",
  })
  createOrganization(
    @ApiRequestUser() user: AuthJwtUser,
    @Body() dto: CreateOrganizationRequestDto
  ) {
    return this.service.createOrganization({
      name: dto.name,
      userId: user.sub,
    });
  }

  @Get("members")
  @UseGuards(OrgMemberGuard)
  @ApiOrgIdHeader()
  @ApiEnvelopeResponse(OrganizationMemberResponseDto, {
    auth: "required",
    description:
      "List members of the organization from X-ORG-ID with optional search and cursor pagination",
    errorResponses: [
      {
        description: "Not a member of the organization",
        status: HttpStatus.FORBIDDEN,
      },
    ],
    httpStatus: HttpStatus.OK,
    isArray: true,
    summary: "List organization members",
  })
  listMembers(@Query() query: ListOrganizationMembersQueryDto) {
    return this.service.listMembers({
      pagination: {
        cursor: query.cursor,
        limit: query.limit,
      },
      q: query.q,
    });
  }

  @Post("invites")
  @UseGuards(OrgMemberGuard, OrgRoleGuard)
  @RequireOrgRole(OrganizationRole.ADMIN)
  @ApiOrgIdHeader()
  @ApiEnvelopeResponse(OrganizationInviteCreatedResponseDto, {
    auth: "required",
    description:
      "Create organization invites. Returns the raw token for copy-link delivery. The whole batch succeeds or none are created.",
    errorResponses: [
      {
        description: "Not a member of the organization, or role is below admin",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Email is already a member or has an active invite",
        status: HttpStatus.CONFLICT,
      },
      {
        description: "Organization member limit reached for this plan",
        status: HttpStatus.TOO_MANY_REQUESTS,
      },
    ],
    httpStatus: HttpStatus.CREATED,
    isArray: true,
    summary: "Create organization invites",
  })
  createInvites(@Body() dto: CreateOrganizationInvitesRequestDto) {
    return this.service.createInvites({
      emails: dto.emails,
      role: dto.role,
    });
  }

  @Get("invites")
  @UseGuards(OrgMemberGuard, OrgRoleGuard)
  @RequireOrgRole(OrganizationRole.ADMIN)
  @ApiOrgIdHeader()
  @ApiEnvelopeResponse(OrganizationInviteResponseDto, {
    auth: "required",
    description:
      "List pending and expired (not revoked, accepted, or declined) invites for the organization from X-ORG-ID. Does not return tokens.",
    errorResponses: [
      {
        description: "Not a member of the organization, or role is below admin",
        status: HttpStatus.FORBIDDEN,
      },
    ],
    httpStatus: HttpStatus.OK,
    isArray: true,
    summary: "List organization invites",
  })
  listInvites(@Query() query: ListOrganizationInvitesQueryDto) {
    return this.service.listInvites({
      pagination: {
        cursor: query.cursor,
        limit: query.limit,
      },
    });
  }

  @Post("invites/:id/resend")
  @UseGuards(OrgMemberGuard, OrgRoleGuard)
  @RequireOrgRole(OrganizationRole.ADMIN)
  @ApiOrgIdHeader()
  @ApiEnvelopeResponse(OrganizationInviteCreatedResponseDto, {
    auth: "required",
    description:
      "Rotate the invite token, reset TTL, and return a new raw token. Resending an expired invite re-occupies a seat.",
    errorResponses: [
      {
        description: "Not a member of the organization, or role is below admin",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Invite not found, or not pending/expired in this org",
        status: HttpStatus.NOT_FOUND,
      },
      {
        description: "Organization member limit reached for this plan",
        status: HttpStatus.TOO_MANY_REQUESTS,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Resend an organization invite",
  })
  resendInvite(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.resendInvite({ id });
  }

  @Delete("invites/:id")
  @UseGuards(OrgMemberGuard, OrgRoleGuard)
  @RequireOrgRole(OrganizationRole.ADMIN)
  @ApiOrgIdHeader()
  @ApiEnvelopeResponse(null, {
    auth: "required",
    description: "Revoke a pending or expired organization invite",
    errorResponses: [
      {
        description: "Not a member of the organization, or role is below admin",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Invite not found, or already consumed/revoked",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Revoke an organization invite",
  })
  revokeInvite(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.revokeInvite({ id });
  }
}
