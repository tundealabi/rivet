import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";

import {
  ApiEnvelopeResponse,
  ApiPublic,
  ApiRequestUser,
} from "@/common/decorators";
import { AuthJwtUser } from "@/modules/auth/auth.entities";

import {
  AcceptInvitationByTokenRequestDto,
  AcceptInvitationResponseDto,
  InvitationPreviewQueryDto,
  InvitationPreviewResponseDto,
  ListUserInvitationsQueryDto,
  UserInvitationResponseDto,
} from "./dto";
import { OrganizationService } from "./organization.service";

@Controller("invitations")
export class InvitationsController {
  constructor(private readonly service: OrganizationService) {}

  @Get()
  @ApiEnvelopeResponse(UserInvitationResponseDto, {
    auth: "required",
    description:
      "List pending unexpired invitations for the authenticated user's email. Does not return tokens.",
    httpStatus: HttpStatus.OK,
    isArray: true,
    summary: "List pending invitations",
  })
  listInvitations(
    @ApiRequestUser() user: AuthJwtUser,
    @Query() query: ListUserInvitationsQueryDto
  ) {
    return this.service.listUserInvitations({
      pagination: {
        cursor: query.cursor,
        limit: query.limit,
      },
      userId: user.sub,
    });
  }

  @ApiPublic()
  @Get("preview")
  @ApiEnvelopeResponse(InvitationPreviewResponseDto, {
    auth: "public",
    description:
      "Preview an invitation by token for the landing page. Invalid or expired tokens return the same generic not-found.",
    errorResponses: [
      {
        description: "Invite not found, expired, revoked, or already consumed",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Preview an invitation",
  })
  previewInvitation(@Query() query: InvitationPreviewQueryDto) {
    return this.service.previewInvitation({ token: query.token });
  }

  @Post("accept")
  @ApiEnvelopeResponse(AcceptInvitationResponseDto, {
    auth: "required",
    description:
      "Accept an invitation by token. Authenticated email must match the invite email.",
    errorResponses: [
      {
        description: "Authenticated email does not match the invite",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Invite not found, expired, revoked, or already consumed",
        status: HttpStatus.NOT_FOUND,
      },
      {
        description: "Already a member of the organization",
        status: HttpStatus.CONFLICT,
      },
      {
        description: "Organization member limit reached for this plan",
        status: HttpStatus.TOO_MANY_REQUESTS,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Accept an invitation by token",
  })
  acceptInvitationByToken(
    @ApiRequestUser() user: AuthJwtUser,
    @Body() dto: AcceptInvitationByTokenRequestDto
  ) {
    return this.service.acceptInvitation({
      token: dto.token,
      userId: user.sub,
    });
  }

  @Post(":id/accept")
  @ApiEnvelopeResponse(AcceptInvitationResponseDto, {
    auth: "required",
    description:
      "Accept an invitation by id. Authenticated email must match the invite email.",
    errorResponses: [
      {
        description: "Authenticated email does not match the invite",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Invite not found, expired, revoked, or already consumed",
        status: HttpStatus.NOT_FOUND,
      },
      {
        description: "Already a member of the organization",
        status: HttpStatus.CONFLICT,
      },
      {
        description: "Organization member limit reached for this plan",
        status: HttpStatus.TOO_MANY_REQUESTS,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Accept an invitation by id",
  })
  acceptInvitationById(
    @ApiRequestUser() user: AuthJwtUser,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    return this.service.acceptInvitation({
      id,
      userId: user.sub,
    });
  }

  @Post(":id/decline")
  @ApiEnvelopeResponse(null, {
    auth: "required",
    description:
      "Decline an invitation. Authenticated email must match the invite email.",
    errorResponses: [
      {
        description: "Authenticated email does not match the invite",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Invite not found, expired, revoked, or already consumed",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Decline an invitation",
  })
  declineInvitation(
    @ApiRequestUser() user: AuthJwtUser,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    return this.service.declineInvitation({
      id,
      userId: user.sub,
    });
  }
}
