import { Injectable } from "@nestjs/common";
import type {
  ProjectDetailResponseWire,
  ProjectResponseWire,
} from "@rivet/shared/api";
import { PLAN_LIMITS } from "@rivet/shared/constants";
import { ErrorCode, ErrorMessage, PlanTier } from "@rivet/shared/enums";

import { DomainError } from "@/common/errors";
import { TenantContextService } from "@/common/services";
import { DatabaseService } from "@/database/database.service";
import type { DbOptions } from "@/database/database.types";
import { Project } from "@/generated/prisma/client";
import { OrgService } from "@/modules/org/org.service";
import { ProjectService as ProjectModuleService } from "@/modules/project/project.service";
import type { ProjectWithCreator } from "@/modules/project/project.types";

import {
  CreateProjectInput,
  ListProjectsInput,
  UpdateProjectInput,
} from "./project.types";

@Injectable()
export class ProjectService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly orgService: OrgService,
    private readonly projectService: ProjectModuleService,
    private readonly tenantContext: TenantContextService
  ) {}

  async createProject(input: CreateProjectInput): Promise<ProjectResponseWire> {
    const project = await this.databaseService.client.$transaction(
      async (tx) => {
        const options = { tx };

        await this.assertWithinProjectLimit(options);

        return this.projectService.create(
          {
            ...input,
            organizationId: this.tenantContext.orgId,
          },
          options
        );
      }
    );

    return this.toResponse(project);
  }

  async getProject(
    id: string,
    userId: string
  ): Promise<ProjectDetailResponseWire> {
    const project = await this.projectService.findByIdWithCreator({ id });

    if (!project) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    return this.toDetailResponse(project, userId);
  }

  async listProjects(input: ListProjectsInput): Promise<ProjectResponseWire[]> {
    const projects = await this.projectService.list({
      archived: input.archived,
    });

    return projects.map((project) => this.toResponse(project));
  }

  async updateProject(input: UpdateProjectInput): Promise<ProjectResponseWire> {
    await this.projectService.getActiveById({ id: input.id });

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

  async archiveProject(id: string): Promise<ProjectResponseWire> {
    const archived = await this.projectService.archive(id);

    if (!archived) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    return this.toResponse(archived);
  }

  async unarchiveProject(id: string): Promise<ProjectResponseWire> {
    const unarchived = await this.projectService.unarchive(id);

    if (!unarchived) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    return this.toResponse(unarchived);
  }

  async deleteProject(id: string): Promise<ProjectResponseWire> {
    const deleted = await this.projectService.delete(id);

    if (!deleted) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    return this.toResponse(deleted);
  }

  private async assertWithinProjectLimit(options?: DbOptions): Promise<void> {
    const organization = await this.orgService.findById(
      this.tenantContext.orgId,
      options
    );

    if (!organization) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    const limit = PLAN_LIMITS[organization.planTier as PlanTier].projects;

    if (limit === null) {
      return;
    }

    const projectCount = await this.projectService.countInOrg(
      this.tenantContext.orgId,
      options
    );

    if (projectCount >= limit) {
      throw new DomainError(
        "TOO_MANY_REQUESTS",
        ErrorCode.ORG_PROJECT_LIMIT_EXCEEDED,
        ErrorMessage.ORG_PROJECT_LIMIT_EXCEEDED
      );
    }
  }

  private toResponse(project: Project): ProjectResponseWire {
    return {
      archivedAt: project.archivedAt?.toISOString() ?? null,
      createdAt: project.createdAt.toISOString(),
      description: project.description,
      id: project.id,
      key: project.key,
      name: project.name,
    };
  }

  private toDetailResponse(
    project: ProjectWithCreator,
    userId: string
  ): ProjectDetailResponseWire {
    return {
      ...this.toResponse(project),
      createdBy: this.formatCreatorName(project.createdBy),
      isCreator: project.createdById === userId,
    };
  }

  private formatCreatorName(
    createdBy: ProjectWithCreator["createdBy"]
  ): string | null {
    if (!createdBy) {
      return null;
    }

    const name = `${createdBy.firstName} ${createdBy.lastName}`.trim();
    return name.length > 0 ? name : null;
  }
}
