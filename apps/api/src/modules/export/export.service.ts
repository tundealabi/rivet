import { ExportJob } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";

import { DomainError } from "@/common/errors";
import { DbOptions } from "@/database/database.types";

import { ExportRepository } from "./export.repository";
import {
  CountExportJobsCreatedBetweenInput,
  CreateExportJobInput,
  FindExportJobByIdempotencyInput,
  FindExportJobForRequesterInput,
  UpdateExportJobInput,
} from "./export.types";

@Injectable()
export class ExportService {
  constructor(private readonly exportRepository: ExportRepository) {}

  async create(
    input: CreateExportJobInput,
    options?: DbOptions
  ): Promise<ExportJob> {
    return this.exportRepository.create(
      {
        data: {
          filterAssigneeId: input.filterAssigneeId,
          filterPriority: input.filterPriority,
          filterStatus: input.filterStatus,
          filterUnassigned: input.filterUnassigned,
          idempotencyKey: input.idempotencyKey,
          organizationId: input.organizationId,
          projectId: input.projectId,
          requestedById: input.requestedById,
        },
      },
      options
    );
  }

  async countCreatedBetween(
    input: CountExportJobsCreatedBetweenInput,
    options?: DbOptions
  ): Promise<number> {
    return this.exportRepository.count(
      {
        where: {
          createdAt: {
            gte: input.createdAtGte,
            lt: input.createdAtLt,
          },
        },
      },
      options
    );
  }

  async findByIdempotencyKey(
    input: FindExportJobByIdempotencyInput,
    options?: DbOptions
  ): Promise<ExportJob | null> {
    return this.exportRepository.findUnique(
      {
        where: {
          organizationId_requestedById_idempotencyKey: {
            idempotencyKey: input.idempotencyKey,
            organizationId: input.organizationId,
            requestedById: input.requestedById,
          },
        },
      },
      options
    );
  }

  async getById(id: string, options?: DbOptions): Promise<ExportJob> {
    const exportJob = await this.exportRepository.findUnique(
      { where: { id } },
      options
    );

    if (!exportJob) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.EXPORT_NOT_FOUND,
        ErrorMessage.EXPORT_NOT_FOUND
      );
    }

    return exportJob;
  }

  async getForRequester(
    input: FindExportJobForRequesterInput,
    options?: DbOptions
  ): Promise<ExportJob> {
    const exportJob = await this.exportRepository.findUnique(
      {
        where: {
          id: input.id,
          requestedById: input.requestedById,
        },
      },
      options
    );

    if (!exportJob) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.EXPORT_NOT_FOUND,
        ErrorMessage.EXPORT_NOT_FOUND
      );
    }

    return exportJob;
  }

  async update(
    id: string,
    data: UpdateExportJobInput,
    options?: DbOptions
  ): Promise<ExportJob> {
    const updated = await this.exportRepository.update(
      { where: { id }, data },
      options
    );

    if (!updated) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.EXPORT_NOT_FOUND,
        ErrorMessage.EXPORT_NOT_FOUND
      );
    }

    return updated;
  }
}
