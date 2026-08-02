import { Injectable } from "@nestjs/common";
import type { ProjectResponseWire } from "@rivet/shared/api";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";

import { DomainError } from "@/common/errors";
import { Project } from "@/generated/prisma/client";
import { OrgMemberService } from "@/modules/org-member/org-member.service";
import { ProjectService as ProjectModuleService } from "@/modules/project/project.service";

import { CreateProjectInput, UpdateProjectInput } from "./project.types";

@Injectable()
export class ProjectService {
  constructor(
    private readonly orgMemberService: OrgMemberService,
    private readonly projectService: ProjectModuleService
  ) {}

  async createProject(input: CreateProjectInput): Promise<ProjectResponseWire> {
    const orgMember = await this.orgMemberService.findByOrgAndUser({
      orgId: input.organizationId,
      userId: input.createdById,
    });
    if (!orgMember) {
      throw new DomainError(
        "FORBIDDEN",
        ErrorCode.FORBIDDEN,
        ErrorMessage.FORBIDDEN
      );
    }
    const project = await this.projectService.create(input);
    return this.toResponse(project);
  }

  async updateProject(input: UpdateProjectInput): Promise<ProjectResponseWire> {
    const orgMember = await this.orgMemberService.findByOrgAndUser({
      orgId: input.organizationId,
      userId: input.userId,
    });

    if (!orgMember) {
      throw new DomainError(
        "FORBIDDEN",
        ErrorCode.FORBIDDEN,
        ErrorMessage.FORBIDDEN
      );
    }
    const project = await this.projectService.update(input.id, input);

    if (!project) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }
    return this.toResponse(project);
  }

  private toResponse(project: Project): ProjectResponseWire {
    return {
      createdAt: project.createdAt.toISOString(),
      description: project.description,
      id: project.id,
      key: project.key,
      name: project.name,
    };
  }
}
