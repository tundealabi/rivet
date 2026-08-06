import { Project } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { CURSOR_PAGINATION_MAX_LIMIT } from "@rivet/shared/constants";
import { ErrorMessage } from "@rivet/shared/enums";

import { ValidationError } from "@/common/errors";
import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";

import { ProjectRepository } from "./project.repository";
import {
  CreateProjectInput,
  FindProjectByIdInput,
  ListProjectsForOrganizationInput,
  UpdateProjectInput,
} from "./project.types";

@Injectable()
export class ProjectService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly projectRepository: ProjectRepository
  ) {}

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

  async listForOrganization(
    input: ListProjectsForOrganizationInput,
    options?: DbOptions
  ): Promise<Project[]> {
    return this.projectRepository.findMany(
      {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: CURSOR_PAGINATION_MAX_LIMIT,
        where: {
          organizationId: input.organizationId,
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
          organizationId: input.organizationId,
        },
      },
      options
    );
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
}
