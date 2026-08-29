import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OrganizationRole } from "@rivet/shared/enums";

import {
  ApiEnvelopeResponse,
  ApiOrgIdHeader,
  RequireOrgRole,
} from "@/common/decorators";
import { OrgMemberGuard, OrgRoleGuard } from "@/common/guards";
import { ParseUuidPipe } from "@/common/pipes";

import {
  CreateIssueCommentRequestDto,
  CreateIssueRequestDto,
  IssueActivityResponseDto,
  IssueCommentResponseDto,
  IssueResponseDto,
  IssueSummaryQueryDto,
  IssueSummaryResponseDto,
  ListIssueActivityQueryDto,
  ListIssueCommentsQueryDto,
  ListIssuesQueryDto,
  UpdateIssueCommentRequestDto,
  UpdateIssueRequestDto,
} from "./dto";
import { IssueService } from "./issue.service";

@Controller("issues")
@UseGuards(OrgMemberGuard, OrgRoleGuard)
@ApiOrgIdHeader()
export class IssueController {
  constructor(private readonly service: IssueService) {}

  @Post()
  @RequireOrgRole(OrganizationRole.MEMBER)
  @ApiEnvelopeResponse(IssueResponseDto, {
    auth: "required",
    description:
      "Create an issue in a project within the organization from X-ORG-ID",
    errorResponses: [
      {
        description: "Not a member of the organization, or role is viewer",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Project is archived",
        status: HttpStatus.CONFLICT,
      },
      {
        description: "Project not found",
        status: HttpStatus.NOT_FOUND,
      },
      {
        description: "Assignee is not an organization member",
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      },
    ],
    httpStatus: HttpStatus.CREATED,
    summary: "Create an issue",
  })
  create(@Body() dto: CreateIssueRequestDto): Promise<IssueResponseDto> {
    return this.service.createIssue({
      assigneeId: dto.assigneeId,
      description: dto.description,
      priority: dto.priority,
      projectId: dto.projectId,
      status: dto.status,
      title: dto.title,
    });
  }

  @Get()
  @ApiEnvelopeResponse(IssueResponseDto, {
    auth: "required",
    description:
      "List issues for a project with cursor pagination. Optional status, priority, and assignee filters (assigneeId accepts a user UUID, 'me', or 'unassigned').",
    errorResponses: [
      {
        description: "Not a member of the organization",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Project not found",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    isArray: true,
    summary: "List project issues",
  })
  list(@Query() query: ListIssuesQueryDto) {
    return this.service.listIssues({
      assigneeId: query.assigneeId,
      pagination: {
        cursor: query.cursor,
        limit: query.limit,
      },
      priority: query.priority,
      projectId: query.projectId,
      status: query.status,
    });
  }

  @Get("summary")
  @ApiEnvelopeResponse(IssueSummaryResponseDto, {
    auth: "required",
    description: "Issue counts for a project (total, open, by status)",
    errorResponses: [
      {
        description: "Not a member of the organization",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Project not found",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Get issue summary",
  })
  summary(@Query() query: IssueSummaryQueryDto) {
    return this.service.getIssueSummary({
      projectId: query.projectId,
    });
  }

  @Get(":id")
  @ApiEnvelopeResponse(IssueResponseDto, {
    auth: "required",
    description: "Get an issue by ID in the organization from X-ORG-ID",
    errorResponses: [
      {
        description: "Not a member of the organization",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Issue not found",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Get an issue",
  })
  get(@Param("id", ParseUuidPipe) id: string): Promise<IssueResponseDto> {
    return this.service.getIssue(id);
  }

  @Patch(":id")
  @RequireOrgRole(OrganizationRole.MEMBER)
  @ApiEnvelopeResponse(IssueResponseDto, {
    auth: "required",
    description: "Update an issue in the organization from X-ORG-ID",
    errorResponses: [
      {
        description: "Not a member of the organization, or role is viewer",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Project is archived",
        status: HttpStatus.CONFLICT,
      },
      {
        description: "Issue not found",
        status: HttpStatus.NOT_FOUND,
      },
      {
        description: "High-risk field changed since last read",
        status: HttpStatus.CONFLICT,
      },
      {
        description: "Illegal status transition",
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      },
      {
        description: "Assignee is not an organization member",
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Update an issue",
  })
  update(
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateIssueRequestDto
  ): Promise<IssueResponseDto> {
    return this.service.updateIssue({
      assigneeId: dto.assigneeId,
      description: dto.description,
      expectedAssigneeId: dto.expectedAssigneeId,
      expectedDescriptionHash: dto.expectedDescriptionHash,
      expectedStatus: dto.expectedStatus,
      id,
      priority: dto.priority,
      status: dto.status,
      title: dto.title,
    });
  }

  @Delete(":id")
  @RequireOrgRole(OrganizationRole.MEMBER)
  @ApiEnvelopeResponse(IssueResponseDto, {
    auth: "required",
    description: "Delete an issue in the organization from X-ORG-ID",
    errorResponses: [
      {
        description: "Not a member of the organization, or role is viewer",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Project is archived",
        status: HttpStatus.CONFLICT,
      },
      {
        description: "Issue not found",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Delete an issue",
  })
  delete(@Param("id", ParseUuidPipe) id: string): Promise<IssueResponseDto> {
    return this.service.deleteIssue(id);
  }

  @Get(":id/activity")
  @ApiEnvelopeResponse(IssueActivityResponseDto, {
    auth: "required",
    description:
      "List field-change activity on an issue with cursor pagination, newest first",
    errorResponses: [
      {
        description: "Not a member of the organization",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Issue not found",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    isArray: true,
    summary: "List issue activity",
  })
  listActivity(
    @Param("id", ParseUuidPipe) issueId: string,
    @Query() query: ListIssueActivityQueryDto
  ) {
    return this.service.listActivity({
      issueId,
      pagination: {
        cursor: query.cursor,
        limit: query.limit,
      },
    });
  }

  @Get(":id/comments")
  @ApiEnvelopeResponse(IssueCommentResponseDto, {
    auth: "required",
    description:
      "List comments on an issue with cursor pagination, oldest first",
    errorResponses: [
      {
        description: "Not a member of the organization",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Issue not found",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    isArray: true,
    summary: "List issue comments",
  })
  listComments(
    @Param("id", ParseUuidPipe) issueId: string,
    @Query() query: ListIssueCommentsQueryDto
  ) {
    return this.service.listComments({
      issueId,
      pagination: {
        cursor: query.cursor,
        limit: query.limit,
      },
    });
  }

  @Post(":id/comments")
  @RequireOrgRole(OrganizationRole.MEMBER)
  @ApiEnvelopeResponse(IssueCommentResponseDto, {
    auth: "required",
    description:
      "Create a comment on an issue in the organization from X-ORG-ID",
    errorResponses: [
      {
        description: "Not a member of the organization, or role is viewer",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Project is archived",
        status: HttpStatus.CONFLICT,
      },
      {
        description: "Issue not found",
        status: HttpStatus.NOT_FOUND,
      },
      {
        description: "Comment rate limit exceeded",
        status: HttpStatus.TOO_MANY_REQUESTS,
      },
    ],
    httpStatus: HttpStatus.CREATED,
    summary: "Create an issue comment",
  })
  createComment(
    @Param("id", ParseUuidPipe) issueId: string,
    @Body() dto: CreateIssueCommentRequestDto
  ): Promise<IssueCommentResponseDto> {
    return this.service.createComment({
      body: dto.body,
      issueId,
    });
  }

  @Patch(":id/comments/:commentId")
  @RequireOrgRole(OrganizationRole.MEMBER)
  @ApiEnvelopeResponse(IssueCommentResponseDto, {
    auth: "required",
    description:
      "Update a comment. Authors may edit their own comments; admins and owners may edit any.",
    errorResponses: [
      {
        description:
          "Not a member of the organization, role is viewer, or not the author",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Project is archived",
        status: HttpStatus.CONFLICT,
      },
      {
        description: "Issue or comment not found",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Update an issue comment",
  })
  updateComment(
    @Param("id", ParseUuidPipe) issueId: string,
    @Param("commentId", ParseUuidPipe) commentId: string,
    @Body() dto: UpdateIssueCommentRequestDto
  ): Promise<IssueCommentResponseDto> {
    return this.service.updateComment({
      body: dto.body,
      commentId,
      issueId,
    });
  }

  @Delete(":id/comments/:commentId")
  @RequireOrgRole(OrganizationRole.MEMBER)
  @ApiEnvelopeResponse(IssueCommentResponseDto, {
    auth: "required",
    description:
      "Delete a comment. Authors may delete their own comments; admins and owners may delete any.",
    errorResponses: [
      {
        description:
          "Not a member of the organization, role is viewer, or not the author",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Project is archived",
        status: HttpStatus.CONFLICT,
      },
      {
        description: "Issue or comment not found",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Delete an issue comment",
  })
  deleteComment(
    @Param("id", ParseUuidPipe) issueId: string,
    @Param("commentId", ParseUuidPipe) commentId: string
  ): Promise<IssueCommentResponseDto> {
    return this.service.deleteComment({
      commentId,
      issueId,
    });
  }
}
