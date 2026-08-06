import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
    description: "List all projects in the organization from X-ORG-ID",
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
  list() {
    return this.service.listProjects();
  }

  @Get(":id")
  @ApiEnvelopeResponse(ProjectResponseDto, {
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
  get(@Param("id", ParseUUIDPipe) id: string): Promise<ProjectResponseDto> {
    return this.service.getProject(id);
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
