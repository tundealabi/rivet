import { Controller, Get, HttpStatus, UseGuards } from "@nestjs/common";

import { ApiEnvelopeResponse, ApiRequestUser } from "@/common/decorators";
import { AuthJwtUser } from "@/modules/auth/auth.entities";
import { AuthUserJwtGuard } from "@/modules/auth/auth.guard";

import { UserOrganizationResponseDto } from "./dto";
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
}
