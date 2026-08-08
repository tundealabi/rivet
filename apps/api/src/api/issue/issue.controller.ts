import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { ApiEnvelopeResponse, ApiOrgIdHeader } from "@/common/decorators";
import { OrgMemberGuard } from "@/common/guards";
import { AuthUserJwtGuard } from "@/modules/auth/auth.guard";

import {
  CreateIssueRequestDto,
  IssueResponseDto,
  IssueSummaryQueryDto,
  IssueSummaryResponseDto,
  ListIssuesQueryDto,
  UpdateIssueRequestDto,
} from "./dto";
import { IssueService } from "./issue.service";

@Controller("issues")
@UseGuards(AuthUserJwtGuard, OrgMemberGuard)
@ApiOrgIdHeader()
export class IssueController {
  constructor(private readonly service: IssueService) {}

  @Post()
  @ApiEnvelopeResponse(IssueResponseDto, {
    auth: "required",
    description:
      "Create an issue in a project within the organization from X-ORG-ID",
    errorResponses: [
      {
        description: "Not a member of the organization",
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
    ],
    httpStatus: HttpStatus.CREATED,
    summary: "Create an issue",
  })
  create(@Body() dto: CreateIssueRequestDto): Promise<IssueResponseDto> {
    return this.service.createIssue({
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
      "List issues for a project with cursor pagination. Optional status filter for board columns.",
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
  get(@Param("id", ParseUUIDPipe) id: string): Promise<IssueResponseDto> {
    return this.service.getIssue(id);
  }

  @Patch(":id")
  @ApiEnvelopeResponse(IssueResponseDto, {
    auth: "required",
    description: "Update an issue in the organization from X-ORG-ID",
    errorResponses: [
      {
        description: "Not a member of the organization",
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
    summary: "Update an issue",
  })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateIssueRequestDto
  ): Promise<IssueResponseDto> {
    return this.service.updateIssue({
      description: dto.description,
      id,
      priority: dto.priority,
      status: dto.status,
      title: dto.title,
    });
  }
}
