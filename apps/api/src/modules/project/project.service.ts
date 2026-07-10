import { Project } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { ErrorMessage } from "@rivet/shared/enums";

import { ValidationError } from "@/common/errors";
import { DbOptions } from "@/database/database.types";

import { ProjectRepository } from "./project.repository";
import { CreateProjectInput, UpdateProjectInput } from "./project.types";

@Injectable()
export class ProjectService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async create(
    input: CreateProjectInput,
    options?: DbOptions
  ): Promise<Project> {
    const project = await this.projectRepository.create(input, options);
    if (!project) {
      throw new ValidationError({
        name: [{ message: ErrorMessage.PROJECT_NAME_ALREADY_EXISTS }],
      });
    }
    return project;
  }

  async update(
    id: string,
    input: UpdateProjectInput,
    options?: DbOptions
  ): Promise<Project | null> {
    return this.projectRepository.update(
      { id },
      {
        description: input.description,
        name: input.name,
      },
      options
    );
  }
}
