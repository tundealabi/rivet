import { ExportJob, ExportJobStatus } from "@generated/prisma";
import { Injectable } from "@nestjs/common";
import type { ExportJobResponseWire } from "@rivet/shared/api";
import { PLAN_LIMITS } from "@rivet/shared/constants";
import { ErrorCode, ErrorMessage, PlanTier } from "@rivet/shared/enums";
import { DATE_UTILS } from "@rivet/shared/utils";

import { DomainError } from "@/common/errors";
import { Helpers } from "@/common/helpers";
import { TenantContextService } from "@/common/services";
import { DatabaseService } from "@/database/database.service";
import type { DbOptions } from "@/database/database.types";
import { ExportQueueService } from "@/jobs/exports/export-queue.service";
import { ExportService as ExportModuleService } from "@/modules/export/export.service";
import { OrgService } from "@/modules/org/org.service";
import { ProjectService as ProjectModuleService } from "@/modules/project/project.service";
import { StorageService } from "@/storage/storage.service";

import {
  EXPORT_DOWNLOAD_FILENAME,
  EXPORT_SIGNED_GET_TTL_SECONDS,
} from "./export.constants";
import { CreateExportInput } from "./export.types";

@Injectable()
export class ExportService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly exportQueue: ExportQueueService,
    private readonly exportService: ExportModuleService,
    private readonly orgService: OrgService,
    private readonly projectService: ProjectModuleService,
    private readonly storage: StorageService,
    private readonly tenantContext: TenantContextService
  ) {}

  async createExport(input: CreateExportInput): Promise<ExportJobResponseWire> {
    const idempotencyKey = Helpers.parseIdempotencyKey(input.idempotencyKey);
    const organizationId = this.tenantContext.orgId;
    const requestedById = this.tenantContext.userId;

    await this.assertProjectExists(input.projectId);

    const snapshot = this.filterSnapshot(input);

    const existing = await this.exportService.findByIdempotencyKey({
      idempotencyKey,
      organizationId,
      requestedById,
    });

    if (existing) {
      await this.enqueueIfWaiting(existing);
      return this.toResponse(existing, null);
    }

    const job = await this.databaseService.client.$transaction(async (tx) => {
      const options = { tx };

      await this.assertWithinQuota(options);

      try {
        return await this.exportService.create(
          {
            ...snapshot,
            idempotencyKey,
            organizationId,
            projectId: input.projectId,
            requestedById,
          },
          options
        );
      } catch (error) {
        if (!this.databaseService.isUniqueConstraintViolationError(error)) {
          throw error;
        }

        const conflicted = await this.exportService.findByIdempotencyKey(
          { idempotencyKey, organizationId, requestedById },
          options
        );
        if (conflicted) {
          return conflicted;
        }

        throw error;
      }
    });

    await this.enqueueIfWaiting(job);
    return this.toResponse(job, null);
  }

  async getExport(id: string): Promise<ExportJobResponseWire> {
    const job = await this.exportService.getForRequester({
      id,
      requestedById: this.tenantContext.userId,
    });

    return this.toResponse(job, await this.signDownloadUrl(job));
  }

  private async assertProjectExists(projectId: string): Promise<void> {
    const project = await this.projectService.findById({ id: projectId });

    if (!project) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }
  }

  private async assertWithinQuota(options?: DbOptions): Promise<void> {
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

    const { start, end } = DATE_UTILS.utcCalendarMonthRange(new Date());
    const usedThisMonth = await this.exportService.countCreatedBetween(
      { createdAtGte: start, createdAtLt: end },
      options
    );

    const limit =
      PLAN_LIMITS[organization.planTier as PlanTier].exportsPerMonth;
    if (limit !== null && usedThisMonth >= limit) {
      throw new DomainError(
        "TOO_MANY_REQUESTS",
        ErrorCode.EXPORT_QUOTA_EXCEEDED,
        ErrorMessage.EXPORT_QUOTA_EXCEEDED
      );
    }
  }

  private async enqueueIfWaiting(job: ExportJob): Promise<void> {
    if (job.status !== ExportJobStatus.QUEUED) {
      return;
    }

    await this.exportQueue.enqueue({
      exportJobId: job.id,
      organizationId: job.organizationId,
      requestedById: job.requestedById,
    });
  }

  private async signDownloadUrl(job: ExportJob): Promise<string | null> {
    if (job.status !== ExportJobStatus.SUCCEEDED || !job.objectKey) {
      return null;
    }

    if (
      job.expiresAt &&
      DATE_UTILS.isPast(DATE_UTILS.fromJSDate(job.expiresAt))
    ) {
      return null;
    }

    return this.storage.signGet(job.objectKey, {
      contentDisposition: `attachment; filename="${EXPORT_DOWNLOAD_FILENAME}"`,
      expiresIn: EXPORT_SIGNED_GET_TTL_SECONDS,
    });
  }

  private filterSnapshot(input: CreateExportInput): {
    filterAssigneeId: string | null;
    filterPriority: CreateExportInput["priority"] | null;
    filterStatus: CreateExportInput["status"] | null;
    filterUnassigned: boolean;
  } {
    const assigneeId = this.resolveAssigneeFilter(input.assigneeId);

    return {
      filterAssigneeId: assigneeId ?? null,
      filterPriority: input.priority ?? null,
      filterStatus: input.status ?? null,
      filterUnassigned: assigneeId === null,
    };
  }

  private resolveAssigneeFilter(
    assigneeId: CreateExportInput["assigneeId"]
  ): string | null | undefined {
    if (assigneeId === undefined) {
      return undefined;
    }

    if (assigneeId === "unassigned") {
      return null;
    }

    if (assigneeId === "me") {
      return this.tenantContext.userId;
    }

    return assigneeId;
  }

  private toResponse(
    job: ExportJob,
    downloadUrl: string | null
  ): ExportJobResponseWire {
    return {
      createdAt: job.createdAt.toISOString(),
      downloadUrl,
      error: job.error,
      expiresAt: job.expiresAt?.toISOString() ?? null,
      id: job.id,
      status: job.status as ExportJobResponseWire["status"],
    };
  }
}
