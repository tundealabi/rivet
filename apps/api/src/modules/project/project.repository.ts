import { Injectable } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

import { DB_PRISMA_ERROR_CODES } from "@/database/database.contants";
import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import { Project } from "@/generated/prisma/client";
import {
  ProjectUncheckedCreateInput,
  ProjectUncheckedUpdateInput,
  ProjectWhereUniqueInput,
} from "@/generated/prisma/models";

@Injectable()
export class ProjectRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    input: ProjectUncheckedCreateInput,
    options?: DbOptions
  ): Promise<Project | null> {
    try {
      const client = this.databaseService.resolveClient(options);
      return client.project.create({ data: input });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === DB_PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION) {
          return null;
        }
      }
      throw err;
    }
  }

  async find(
    where: ProjectWhereUniqueInput,
    options?: DbOptions
  ): Promise<Project | null> {
    const client = this.databaseService.resolveClient(options);
    return client.project.findUnique({ where });
  }

  async update(
    where: ProjectWhereUniqueInput,
    input: ProjectUncheckedUpdateInput,
    options?: DbOptions
  ): Promise<Project | null> {
    try {
      const client = this.databaseService.resolveClient(options);
      return client.project.update({ where, data: input });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === DB_PRISMA_ERROR_CODES.NOT_FOUND) {
          return null;
        }
      }
      throw err;
    }
  }
}
