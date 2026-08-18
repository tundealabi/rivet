import { Project } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { CURSOR_PAGINATION_MAX_LIMIT } from "@rivet/shared/constants";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";

import { DomainError, ValidationError } from "@/common/errors";
import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";

import { ProjectRepository } from "./project.repository";
import {
  CreateProjectInput,
  FindProjectByIdInput,
  ListProjectsInput,
  ProjectWithCreator,
  UpdateProjectInput,
} from "./project.types";

@Injectable()
export class ProjectService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly projectRepository: ProjectRepository
  ) {}

  async countInOrg(orgId: string, options?: DbOptions): Promise<number> {
    return this.projectRepository.count(
      { where: { organizationId: orgId } },
      options
    );
  }

  async create(
    input: CreateProjectInput,
    options?: DbOptions
  ): Promise<Project> {
    try {
      return await this.projectRepository.create(
        {
          data: {
            createdById: input.createdById,
            description: input.description,
            key: input.key,
            name: input.name,
            organizationId: input.organizationId,
          },
        },
        options
      );
    } catch (err) {
      if (err instanceof Error) {
        if (
          this.databaseService.isUniqueConstraintViolationError(err, "name")
        ) {
          throw new ValidationError({
            name: [{ message: ErrorMessage.PROJECT_NAME_ALREADY_EXISTS }],
          });
        }

        if (this.databaseService.isUniqueConstraintViolationError(err, "key")) {
          throw new ValidationError({
            key: [{ message: ErrorMessage.PROJECT_KEY_ALREADY_EXISTS }],
          });
        }
      }

      throw err;
    }
  }

  async list(
    input: ListProjectsInput,
    options?: DbOptions
  ): Promise<Project[]> {
    return this.projectRepository.findMany(
      {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: CURSOR_PAGINATION_MAX_LIMIT,
        where: {
          archivedAt: input.archived ? { not: null } : null,
        },
      },
      options
    );
  }

  async findById(
    input: FindProjectByIdInput,
    options?: DbOptions
  ): Promise<Project | null> {
    return this.projectRepository.findFirst(
      {
        where: {
          id: input.id,
        },
      },
      options
    );
  }

  async getActiveById(
    input: FindProjectByIdInput,
    options?: DbOptions
  ): Promise<Project> {
    const project = await this.findById(input, options);

    if (!project) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    if (project.archivedAt) {
      throw new DomainError(
        "CONFLICT",
        ErrorCode.PROJECT_ARCHIVED,
        ErrorMessage.PROJECT_ARCHIVED
      );
    }

    return project;
  }

  async findByIdWithCreator(
    input: FindProjectByIdInput,
    options?: DbOptions
  ): Promise<ProjectWithCreator | null> {
    return this.projectRepository.findFirst(
      {
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        where: {
          id: input.id,
        },
      },
      options
    ) as Promise<ProjectWithCreator | null>;
  }

  async allocateNextIssueNumber(
    projectId: string,
    options?: DbOptions
  ): Promise<number> {
    const updated = await this.projectRepository.update(
      {
        where: { id: projectId },
        data: {
          nextIssueNumber: { increment: 1 },
        },
      },
      options
    );

    if (!updated) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    return updated.nextIssueNumber - 1;
  }

  async update(
    id: string,
    input: UpdateProjectInput,
    options?: DbOptions
  ): Promise<Project | null> {
    return this.projectRepository.update(
      {
        where: { id },
        data: {
          description: input.description,
          name: input.name,
        },
      },
      options
    );
  }

  async archive(id: string, options?: DbOptions): Promise<Project | null> {
    const project = await this.findById({ id }, options);

    if (!project) {
      return null;
    }

    if (project.archivedAt) {
      return project;
    }

    return this.projectRepository.update(
      {
        where: { id },
        data: {
          archivedAt: new Date(),
        },
      },
      options
    );
  }

  async unarchive(id: string, options?: DbOptions): Promise<Project | null> {
    const project = await this.findById({ id }, options);

    if (!project) {
      return null;
    }

    if (!project.archivedAt) {
      return project;
    }

    return this.projectRepository.update(
      {
        where: { id },
        data: {
          archivedAt: null,
        },
      },
      options
    );
  }

  async delete(id: string, options?: DbOptions): Promise<Project | null> {
    return this.projectRepository.delete({ where: { id } }, options);
  }
}
