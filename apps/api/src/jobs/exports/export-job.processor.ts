import { Readable } from "node:stream";

import { ExportJob, ExportJobStatus } from "@generated/prisma";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job, UnrecoverableError } from "bullmq";

import { LOG_MSG } from "@/common/constants";
import { DomainError } from "@/common/errors";
import { TenantContextService } from "@/common/services";
import { ExportService } from "@/modules/export/export.service";
import { IssueService } from "@/modules/issue/issue.service";
import type {
  IssueExportRow,
  IterateIssuesForExportInput,
} from "@/modules/issue/issue.types";
import { Metrics, Trace } from "@/observability";
import { StorageService } from "@/storage/storage.service";

import { EXPORTS_QUEUE } from "../jobs.constants";
import { assertExportWithinCaps, ExportCapError } from "./export.caps";
import {
  EXPORT_OBJECT_TTL_MS,
  EXPORT_WORKER_LOCK_DURATION_MS,
  EXPORT_WORKER_PAGE_SIZE,
} from "./export.constants";
import { encodeCsv } from "./export.csv";
import type { ExportJobPayload } from "./export.types";

@Injectable()
@Processor(EXPORTS_QUEUE, { lockDuration: EXPORT_WORKER_LOCK_DURATION_MS })
export class ExportJobProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportJobProcessor.name);

  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly exportService: ExportService,
    private readonly issueService: IssueService,
    private readonly storage: StorageService
  ) {
    super();
  }

  async process(job: Job<ExportJobPayload>): Promise<void> {
    const { organizationId, requestedById } = job.data;

    await this.tenantContext.runWithTenantContext(
      { orgId: organizationId, userId: requestedById },
      () =>
        Trace.runWithExportProcess(job.data, () => this.processWithinSpan(job))
    );
  }

  private async processWithinSpan(job: Job<ExportJobPayload>): Promise<void> {
    const { exportJobId, organizationId } = job.data;
    const exportJob = await this.loadJob(exportJobId);

    if (exportJob.status === ExportJobStatus.SUCCEEDED && exportJob.objectKey) {
      this.logger.log({
        exportJobId,
        msg: LOG_MSG.exportAlreadySucceeded,
        orgId: organizationId,
      });
      return;
    }

    const endTimer = Metrics.startExportJobTimer();

    try {
      await this.exportService.update(exportJobId, {
        error: null,
        status: ExportJobStatus.RUNNING,
      });

      const objectKey = this.storage.objectKey(organizationId, exportJobId);
      const startedAtMs = Date.now();
      let rowCount = 0;

      await this.storage.upload(
        objectKey,
        Readable.from(
          encodeCsv(
            this.cappedRows(
              this.issueService.iterateForExport({
                ...issueFiltersFromExportJob(exportJob),
                limit: EXPORT_WORKER_PAGE_SIZE,
              }),
              startedAtMs,
              () => {
                rowCount += 1;
                return rowCount;
              }
            )
          ),
          { encoding: "utf8" }
        )
      );

      await this.exportService.update(exportJobId, {
        error: null,
        expiresAt: new Date(Date.now() + EXPORT_OBJECT_TTL_MS),
        objectKey,
        status: ExportJobStatus.SUCCEEDED,
      });

      Metrics.recordExportJob("succeeded");
      this.logger.log({
        exportJobId,
        msg: LOG_MSG.exportSucceeded,
        orgId: organizationId,
        rowCount,
      });
    } catch (error) {
      Metrics.recordExportJob("failed");
      this.logger.error({
        err: toLogError(error),
        exportJobId,
        msg: LOG_MSG.exportFailed,
        orgId: organizationId,
      });

      const message = errorMessage(error);

      try {
        await this.exportService.update(exportJobId, {
          error: message,
          status: ExportJobStatus.FAILED,
        });
      } catch (updateError) {
        this.logger.error({
          err: toLogError(updateError),
          exportJobId,
          msg: LOG_MSG.exportStatusUpdateFailed,
          orgId: organizationId,
        });
      }

      if (error instanceof ExportCapError) {
        throw new UnrecoverableError(message);
      }

      throw error;
    } finally {
      endTimer();
    }
  }

  private async loadJob(exportJobId: string): Promise<ExportJob> {
    try {
      return await this.exportService.getById(exportJobId);
    } catch (error) {
      if (error instanceof DomainError && error.kind === "NOT_FOUND") {
        throw new UnrecoverableError(error.message);
      }
      throw error;
    }
  }

  private async *cappedRows(
    rows: AsyncIterable<IssueExportRow>,
    startedAtMs: number,
    nextCount: () => number
  ): AsyncGenerator<IssueExportRow> {
    for await (const row of rows) {
      assertExportWithinCaps({
        rowCount: nextCount(),
        startedAtMs,
      });
      yield row;
    }
  }
}

function issueFiltersFromExportJob(
  job: Pick<
    ExportJob,
    | "filterAssigneeId"
    | "filterPriority"
    | "filterStatus"
    | "filterUnassigned"
    | "projectId"
  >
): Omit<IterateIssuesForExportInput, "limit"> {
  return {
    assigneeId: job.filterUnassigned
      ? null
      : (job.filterAssigneeId ?? undefined),
    priority: job.filterPriority ?? undefined,
    projectId: job.projectId,
    status: job.filterStatus ?? undefined,
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message.slice(0, 1000);
  }

  return "Export failed";
}

function toLogError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
