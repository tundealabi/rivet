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

import {
  ApiEnvelopeResponse,
  ApiOrgIdHeader,
  ApiRequestUser,
} from "@/common/decorators";
import { OrgMemberGuard } from "@/common/guards";
import { AuthJwtUser } from "@/modules/auth/auth.entities";
import { AuthUserJwtGuard } from "@/modules/auth/auth.guard";

import {
  CreateProjectRequestDto,
  ListProjectsQueryDto,
  ProjectDetailResponseDto,
  ProjectResponseDto,
  UpdateProjectRequestDto,
} from "./dto";
import { ProjectService } from "./project.service";

@Controller("projects")
@UseGuards(AuthUserJwtGuard, OrgMemberGuard)
@ApiOrgIdHeader()
export class ProjectController {
  constructor(private readonly service: ProjectService) {}

  @Post()
  @ApiEnvelopeResponse(ProjectResponseDto, {
    auth: "required",
    description: "Create a project in the organization from X-ORG-ID",
    errorResponses: [
      {
        description: "Not a member of the organization",
        status: HttpStatus.FORBIDDEN,
      },
    ],
    httpStatus: HttpStatus.CREATED,
    summary: "Create a project",
  })
  create(
    @ApiRequestUser() user: AuthJwtUser,
    @Body() dto: CreateProjectRequestDto
  ): Promise<ProjectResponseDto> {
    return this.service.createProject({
      createdById: user.sub,
      description: dto.description,
      key: dto.key,
      name: dto.name,
    });
  }

  @Get()
  @ApiEnvelopeResponse(ProjectResponseDto, {
    auth: "required",
    description:
      "List projects in the organization from X-ORG-ID. Defaults to active projects; pass archived=true for archived only.",
    errorResponses: [
      {
        description: "Not a member of the organization",
        status: HttpStatus.FORBIDDEN,
      },
    ],
    httpStatus: HttpStatus.OK,
    isArray: true,
    summary: "List organization projects",
  })
  list(@Query() query: ListProjectsQueryDto) {
    return this.service.listProjects({
      archived: query.archived,
    });
  }

  @Get(":id")
  @ApiEnvelopeResponse(ProjectDetailResponseDto, {
    auth: "required",
    description: "Get a project by ID in the organization from X-ORG-ID",
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
    summary: "Get a project",
  })
  get(
    @ApiRequestUser() user: AuthJwtUser,
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<ProjectDetailResponseDto> {
    return this.service.getProject(id, user.sub);
  }

  @Patch(":id/archive")
  @ApiEnvelopeResponse(ProjectResponseDto, {
    auth: "required",
    description:
      "Archive a project. Only the project creator can archive. No-op if already archived.",
    errorResponses: [
      {
        description: "Not a member of the organization",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Not the project creator",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Project not found",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Archive a project",
  })
  archive(
    @ApiRequestUser() user: AuthJwtUser,
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<ProjectResponseDto> {
    return this.service.archiveProject(id, user.sub);
  }

  @Patch(":id/unarchive")
  @ApiEnvelopeResponse(ProjectResponseDto, {
    auth: "required",
    description:
      "Unarchive a project. Only the project creator can unarchive. No-op if already active.",
    errorResponses: [
      {
        description: "Not a member of the organization",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Not the project creator",
        status: HttpStatus.FORBIDDEN,
      },
      {
        description: "Project not found",
        status: HttpStatus.NOT_FOUND,
      },
    ],
    httpStatus: HttpStatus.OK,
    summary: "Unarchive a project",
  })
  unarchive(
    @ApiRequestUser() user: AuthJwtUser,
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<ProjectResponseDto> {
    return this.service.unarchiveProject(id, user.sub);
  }

  @Patch(":id")
  @ApiEnvelopeResponse(ProjectResponseDto, {
    auth: "required",
    description: "Update a project in the organization from X-ORG-ID",
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
    httpStatus: HttpStatus.OK,
    summary: "Update a project",
  })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectRequestDto
  ): Promise<ProjectResponseDto> {
    return this.service.updateProject({
      description: dto.description,
      id,
      name: dto.name,
    });
  }
}
