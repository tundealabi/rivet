import { Injectable } from "@nestjs/common";
import type { ProjectResponseWire } from "@rivet/shared/api";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";

import { DomainError } from "@/common/errors";
import { TenantContextService } from "@/common/services";
import { Project } from "@/generated/prisma/client";
import { ProjectService as ProjectModuleService } from "@/modules/project/project.service";

import { CreateProjectInput, UpdateProjectInput } from "./project.types";

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectService: ProjectModuleService,
    private readonly tenantContext: TenantContextService
  ) {}

  async createProject(input: CreateProjectInput): Promise<ProjectResponseWire> {
    const project = await this.projectService.create({
      ...input,
      organizationId: this.tenantContext.orgId,
    });
    return this.toResponse(project);
  }

  async getProject(id: string): Promise<ProjectResponseWire> {
    const project = await this.projectService.findById({
      id,
      organizationId: this.tenantContext.orgId,
    });

    if (!project) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    return this.toResponse(project);
  }

  async listProjects(): Promise<ProjectResponseWire[]> {
    const projects = await this.projectService.listForOrganization({
      organizationId: this.tenantContext.orgId,
    });

    return projects.map((project) => this.toResponse(project));
  }

  async updateProject(input: UpdateProjectInput): Promise<ProjectResponseWire> {
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
