import { Readable } from "node:stream";

import { ExportJobStatus, IssuePriority, IssueStatus } from "@generated/prisma";
import { Logger } from "@nestjs/common";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";
import { type Job, UnrecoverableError } from "bullmq";

import { DomainError } from "@/common/errors";
import { TenantContextService } from "@/common/services";
import { ExportService } from "@/modules/export/export.service";
import { IssueService } from "@/modules/issue/issue.service";
import type { IssueExportRow } from "@/modules/issue/issue.types";
import { Metrics } from "@/observability";
import { StorageService } from "@/storage/storage.service";

import {
  EXPORT_ERROR_DURATION_LIMIT,
  EXPORT_OBJECT_TTL_MS,
  EXPORT_WORKER_MAX_DURATION_MS,
  EXPORT_WORKER_PAGE_SIZE,
} from "./export.constants";
import type { ExportJobPayload } from "./export.types";
import { ExportJobProcessor } from "./export-job.processor";

const payload: ExportJobPayload = {
  exportJobId: "11111111-1111-1111-1111-111111111111",
  organizationId: "22222222-2222-2222-2222-222222222222",
  requestedById: "33333333-3333-3333-3333-333333333333",
};

const objectKey = `${payload.organizationId}/exports/${payload.exportJobId}.csv`;

const exportRow: IssueExportRow = {
  assignee: { firstName: "Ada", lastName: "Lovelace" },
  createdAt: new Date("2026-08-15T12:00:00.000Z"),
  description: "=cmd, and a newline\nhere",
  id: "55555555-5555-5555-5555-555555555555",
  number: 1,
  priority: IssuePriority.HIGH,
  project: { key: "RIV", name: "Rivet" },
  status: IssueStatus.TODO,
  title: "Ship export",
  updatedAt: new Date("2026-08-15T13:00:00.000Z"),
};

const queuedJob = {
  filterAssigneeId: null,
  filterPriority: null,
  filterStatus: null,
  filterUnassigned: false,
  id: payload.exportJobId,
  objectKey: null,
  projectId: "44444444-4444-4444-4444-444444444444",
  status: ExportJobStatus.QUEUED,
};

async function drainUpload(_key: string, body: Readable): Promise<void> {
  for await (const _chunk of body) {
    // Drain so the CSV generator and caps run.
  }
}

async function* asyncOf<T>(...items: T[]): AsyncGenerator<T> {
  await Promise.resolve();
  yield* items;
}

function tenantContextStub(): TenantContextService {
  return {
    runWithTenantContext: jest.fn(
      async (
        context: { orgId: string; userId: string },
        fn: () => Promise<void>
      ) => {
        expect(context).toEqual({
          orgId: payload.organizationId,
          userId: payload.requestedById,
        });
        return fn();
      }
    ),
  } as unknown as TenantContextService;
}

function processor(deps: {
  exportService: object;
  issueService?: object;
  storage?: object;
  tenantContext?: TenantContextService;
}): ExportJobProcessor {
  return new ExportJobProcessor(
    deps.tenantContext ?? tenantContextStub(),
    deps.exportService as ExportService,
    (deps.issueService ?? {
      iterateForExport: jest.fn(() => asyncOf(exportRow)),
    }) as IssueService,
    (deps.storage ?? {
      objectKey: jest.fn().mockReturnValue(objectKey),
      upload: jest.fn(drainUpload),
    }) as unknown as StorageService
  );
}

describe("ExportJobProcessor", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sets CLS from the payload before any ExportJob query", async () => {
    let clsReady = false;
    const getById = jest.fn().mockImplementation(() => {
      expect(clsReady).toBe(true);
      return queuedJob;
    });
    const runWithTenantContext = jest.fn(
      async (
        context: { orgId: string; userId: string },
        fn: () => Promise<void>
      ) => {
        expect(context).toEqual({
          orgId: payload.organizationId,
          userId: payload.requestedById,
        });
        clsReady = true;
        return fn();
      }
    );
    const tenantContext = {
      runWithTenantContext,
    } as unknown as TenantContextService;

    const instance = processor({
      exportService: {
        getById,
        update: jest.fn().mockResolvedValue({}),
      },
      tenantContext,
    });

    await instance.process({ data: payload } as Job<ExportJobPayload>);

    expect(runWithTenantContext).toHaveBeenCalledTimes(1);
    expect(getById).toHaveBeenCalledWith(payload.exportJobId);
  });

  it("uploads CSV then marks SUCCEEDED with objectKey and expiresAt", async () => {
    const now = 1_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);
    const update = jest.fn().mockResolvedValue({});
    let csv = "";
    const upload = jest.fn(async (_key: string, body: Readable) => {
      for await (const chunk of body) {
        csv += typeof chunk === "string" ? chunk : chunk.toString("utf8");
      }
    });
    const iterateForExport = jest.fn(() => asyncOf(exportRow));
    const recordExportJob = jest.spyOn(Metrics, "recordExportJob");

    const instance = processor({
      exportService: {
        getById: jest.fn().mockResolvedValue(queuedJob),
        update,
      },
      issueService: { iterateForExport },
      storage: {
        objectKey: jest.fn().mockReturnValue(objectKey),
        upload,
      },
    });

    await instance.process({ data: payload } as Job<ExportJobPayload>);

    expect(iterateForExport).toHaveBeenCalledWith({
      assigneeId: undefined,
      limit: EXPORT_WORKER_PAGE_SIZE,
      priority: undefined,
      projectId: queuedJob.projectId,
      status: undefined,
    });
    expect(update).toHaveBeenNthCalledWith(1, payload.exportJobId, {
      error: null,
      status: ExportJobStatus.RUNNING,
    });
    expect(upload).toHaveBeenCalledWith(objectKey, expect.any(Readable));
    expect(csv.startsWith("\uFEFF")).toBe(false);
    expect(csv).toContain("'=cmd, and a newline\nhere");
    expect(csv).toContain("RIV-1");
    expect(update).toHaveBeenNthCalledWith(2, payload.exportJobId, {
      error: null,
      expiresAt: new Date(now + EXPORT_OBJECT_TTL_MS),
      objectKey,
      status: ExportJobStatus.SUCCEEDED,
    });
    expect(recordExportJob).toHaveBeenCalledWith("succeeded");
  });

  it("maps unassigned and assignee snapshot filters onto the iterator", async () => {
    const iterateForExport = jest.fn(() => asyncOf());

    await processor({
      exportService: {
        getById: jest.fn().mockResolvedValue({
          ...queuedJob,
          filterUnassigned: true,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      issueService: { iterateForExport },
    }).process({ data: payload } as Job<ExportJobPayload>);

    expect(iterateForExport).toHaveBeenCalledWith(
      expect.objectContaining({
        assigneeId: null,
        limit: EXPORT_WORKER_PAGE_SIZE,
      })
    );

    iterateForExport.mockClear();

    await processor({
      exportService: {
        getById: jest.fn().mockResolvedValue({
          ...queuedJob,
          filterAssigneeId: payload.requestedById,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      issueService: { iterateForExport },
    }).process({ data: payload } as Job<ExportJobPayload>);

    expect(iterateForExport).toHaveBeenCalledWith(
      expect.objectContaining({
        assigneeId: payload.requestedById,
        limit: EXPORT_WORKER_PAGE_SIZE,
      })
    );
  });

  it("is a no-op when the job already SUCCEEDED with an objectKey", async () => {
    const update = jest.fn();
    const iterateForExport = jest.fn(() => asyncOf(exportRow));
    const upload = jest.fn();
    const recordExportJob = jest.spyOn(Metrics, "recordExportJob");

    await processor({
      exportService: {
        getById: jest.fn().mockResolvedValue({
          ...queuedJob,
          objectKey,
          status: ExportJobStatus.SUCCEEDED,
        }),
        update,
      },
      issueService: { iterateForExport },
      storage: { objectKey: jest.fn(), upload },
    }).process({ data: payload } as Job<ExportJobPayload>);

    expect(update).not.toHaveBeenCalled();
    expect(iterateForExport).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(recordExportJob).not.toHaveBeenCalled();
  });

  it("marks FAILED and rethrows when upload fails so BullMQ can retry", async () => {
    const error = jest.spyOn(Logger.prototype, "error").mockImplementation();
    const recordExportJob = jest.spyOn(Metrics, "recordExportJob");
    const update = jest.fn().mockResolvedValue({});
    const boom = new Error("S3 down");

    const instance = processor({
      exportService: {
        getById: jest.fn().mockResolvedValue(queuedJob),
        update,
      },
      storage: {
        objectKey: jest.fn().mockReturnValue(objectKey),
        upload: jest.fn().mockRejectedValue(boom),
      },
    });

    await expect(
      instance.process({ data: payload } as Job<ExportJobPayload>)
    ).rejects.toThrow("S3 down");

    expect(update).toHaveBeenNthCalledWith(2, payload.exportJobId, {
      error: "S3 down",
      status: ExportJobStatus.FAILED,
    });
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: boom,
        exportJobId: payload.exportJobId,
        msg: "export_failed",
        orgId: payload.organizationId,
      })
    );
    expect(recordExportJob).toHaveBeenCalledWith("failed");
  });

  it("marks FAILED and throws UnrecoverableError when a cap is exceeded", async () => {
    const now = jest.spyOn(Date, "now");
    now.mockReturnValue(0);
    const update = jest.fn().mockResolvedValue({});
    const iterateForExport = jest.fn(async function* () {
      await Promise.resolve();
      now.mockReturnValue(EXPORT_WORKER_MAX_DURATION_MS + 1);
      yield exportRow;
    });

    const instance = processor({
      exportService: {
        getById: jest.fn().mockResolvedValue(queuedJob),
        update,
      },
      issueService: { iterateForExport },
    });

    await expect(
      instance.process({ data: payload } as Job<ExportJobPayload>)
    ).rejects.toBeInstanceOf(UnrecoverableError);

    expect(update).toHaveBeenCalledWith(payload.exportJobId, {
      error: EXPORT_ERROR_DURATION_LIMIT,
      status: ExportJobStatus.FAILED,
    });
  });

  it("throws UnrecoverableError when the tenant-scoped lookup returns no row", async () => {
    const instance = processor({
      exportService: {
        getById: jest
          .fn()
          .mockRejectedValue(
            new DomainError(
              "NOT_FOUND",
              ErrorCode.EXPORT_NOT_FOUND,
              ErrorMessage.EXPORT_NOT_FOUND
            )
          ),
        update: jest.fn(),
      },
    });

    await expect(
      instance.process({ data: payload } as Job<ExportJobPayload>)
    ).rejects.toBeInstanceOf(UnrecoverableError);
  });
});
