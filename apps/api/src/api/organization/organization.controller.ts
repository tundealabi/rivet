import { Controller, Get, HttpStatus, Query, UseGuards } from "@nestjs/common";

import {
  ApiEnvelopeResponse,
  ApiOrgIdHeader,
  ApiRequestUser,
} from "@/common/decorators";
import { OrgMemberGuard } from "@/common/guards";
import { AuthJwtUser } from "@/modules/auth/auth.entities";
import { AuthUserJwtGuard } from "@/modules/auth/auth.guard";

import {
  ListOrganizationMembersQueryDto,
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
}
