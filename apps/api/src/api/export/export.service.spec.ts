import { ExportJob, ExportJobStatus, PlanTier } from "@generated/prisma";
import {
  ErrorCode,
  ErrorMessage,
  IssuePriority,
  IssueStatus,
} from "@rivet/shared/enums";

import { DomainError } from "@/common/errors";
import { TenantContextService } from "@/common/services";
import { DatabaseService } from "@/database/database.service";
import { ExportQueueService } from "@/jobs/exports/export-queue.service";
import { ExportService as ExportModuleService } from "@/modules/export/export.service";
import { OrgService } from "@/modules/org/org.service";
import { ProjectService as ProjectModuleService } from "@/modules/project/project.service";
import { StorageService } from "@/storage/storage.service";

import { EXPORT_SIGNED_GET_TTL_SECONDS } from "./export.constants";
import { ExportService } from "./export.service";

const orgId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const userId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const jobId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
const idempotencyKey = "export-key-1";

function exportJob(overrides: Partial<ExportJob> = {}): ExportJob {
  return {
    createdAt: new Date("2026-08-15T12:00:00.000Z"),
    error: null,
    expiresAt: null,
    filterAssigneeId: null,
    filterPriority: null,
    filterStatus: null,
    filterUnassigned: false,
    id: jobId,
    idempotencyKey,
    objectKey: null,
    organizationId: orgId,
    projectId,
    requestedById: userId,
    status: ExportJobStatus.QUEUED,
    updatedAt: new Date("2026-08-15T12:00:00.000Z"),
    ...overrides,
  };
}

function createService(overrides?: {
  countCreatedBetween?: jest.Mock;
  create?: jest.Mock;
  enqueue?: jest.Mock;
  findById?: jest.Mock;
  findByIdempotencyKey?: jest.Mock;
  getForRequester?: jest.Mock;
  isUniqueConstraintViolationError?: jest.Mock;
  projectFindById?: jest.Mock;
  signGet?: jest.Mock;
}) {
  const findByIdempotencyKey =
    overrides?.findByIdempotencyKey ?? jest.fn().mockResolvedValue(null);
  const create = overrides?.create ?? jest.fn().mockResolvedValue(exportJob());
  const countCreatedBetween =
    overrides?.countCreatedBetween ?? jest.fn().mockResolvedValue(0);
  const enqueue = overrides?.enqueue ?? jest.fn().mockResolvedValue(undefined);
  const transaction = jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({})
  );

  const service = new ExportService(
    {
      client: { $transaction: transaction },
      isUniqueConstraintViolationError:
        overrides?.isUniqueConstraintViolationError ??
        jest.fn().mockReturnValue(false),
    } as unknown as DatabaseService,
    { enqueue } as unknown as ExportQueueService,
    {
      countCreatedBetween,
      create,
      findByIdempotencyKey,
      getForRequester: overrides?.getForRequester ?? jest.fn(),
    } as unknown as ExportModuleService,
    {
      findById:
        overrides?.findById ??
        jest.fn().mockResolvedValue({ id: orgId, planTier: PlanTier.FREE }),
    } as unknown as OrgService,
    {
      findById:
        overrides?.projectFindById ??
        jest.fn().mockResolvedValue({ id: projectId }),
    } as unknown as ProjectModuleService,
    {
      signGet:
        overrides?.signGet ??
        jest.fn().mockResolvedValue("https://minio.test/export.csv"),
    } as unknown as StorageService,
    {
      orgId,
      userId,
    } as TenantContextService
  );

  return {
    countCreatedBetween,
    create,
    enqueue,
    findByIdempotencyKey,
    service,
    transaction,
  };
}

describe("ExportService.createExport", () => {
  it("inserts, charges quota, enqueues, and returns 202 payload without a download URL", async () => {
    const { countCreatedBetween, create, enqueue, service } = createService();

    const result = await service.createExport({
      idempotencyKey,
      projectId,
    });

    expect(countCreatedBetween).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      {
        filterAssigneeId: null,
        filterPriority: null,
        filterStatus: null,
        filterUnassigned: false,
        idempotencyKey,
        organizationId: orgId,
        projectId,
        requestedById: userId,
      },
      { tx: {} }
    );
    expect(enqueue).toHaveBeenCalledWith({
      exportJobId: jobId,
      organizationId: orgId,
      requestedById: userId,
    });
    expect(result.downloadUrl).toBeNull();
    expect(result.id).toBe(jobId);
    expect(result.status).toBe(ExportJobStatus.QUEUED);
  });

  it("resolves assigneeId me before persist", async () => {
    const { create, service } = createService();

    await service.createExport({
      assigneeId: "me",
      idempotencyKey,
      projectId,
    });

    expect(create.mock.calls[0][0].filterAssigneeId).toBe(userId);
    expect(create.mock.calls[0][0].filterUnassigned).toBe(false);
  });

  it("snapshots unassigned as filterUnassigned", async () => {
    const { create, service } = createService();

    await service.createExport({
      assigneeId: "unassigned",
      idempotencyKey,
      priority: IssuePriority.HIGH,
      projectId,
      status: IssueStatus.TODO,
    });

    expect(create.mock.calls[0][0]).toMatchObject({
      filterAssigneeId: null,
      filterPriority: IssuePriority.HIGH,
      filterStatus: IssueStatus.TODO,
      filterUnassigned: true,
    });
  });

  it("returns 404 when the project is missing", async () => {
    const { create, enqueue, service } = createService({
      projectFindById: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.createExport({ idempotencyKey, projectId })
    ).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
      kind: "NOT_FOUND",
    });
    expect(create).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("returns EXPORT_QUOTA_EXCEEDED when the org is at the monthly cap", async () => {
    const { create, enqueue, service } = createService({
      countCreatedBetween: jest.fn().mockResolvedValue(10),
    });

    await expect(
      service.createExport({ idempotencyKey, projectId })
    ).rejects.toMatchObject({
      code: ErrorCode.EXPORT_QUOTA_EXCEEDED,
      kind: "TOO_MANY_REQUESTS",
    });
    expect(create).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("does not cap Team plan exports", async () => {
    const { create, service } = createService({
      countCreatedBetween: jest.fn().mockResolvedValue(10_000),
      findById: jest
        .fn()
        .mockResolvedValue({ id: orgId, planTier: PlanTier.TEAM }),
    });

    await service.createExport({ idempotencyKey, projectId });
    expect(create).toHaveBeenCalled();
  });

  it("returns an in-flight job for the same idempotency key without inserting again", async () => {
    const existing = exportJob();
    const { countCreatedBetween, create, enqueue, service, transaction } =
      createService({
        findByIdempotencyKey: jest.fn().mockResolvedValue(existing),
      });

    const result = await service.createExport({ idempotencyKey, projectId });

    expect(transaction).not.toHaveBeenCalled();
    expect(countCreatedBetween).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(existing.id);
    expect(result.downloadUrl).toBeNull();
  });

  it("does not re-enqueue a succeeded idempotent replay", async () => {
    const { enqueue, service } = createService({
      findByIdempotencyKey: jest.fn().mockResolvedValue(
        exportJob({
          objectKey: `${orgId}/exports/${jobId}.csv`,
          status: ExportJobStatus.SUCCEEDED,
        })
      ),
    });

    const result = await service.createExport({ idempotencyKey, projectId });

    expect(enqueue).not.toHaveBeenCalled();
    expect(result.status).toBe(ExportJobStatus.SUCCEEDED);
    expect(result.downloadUrl).toBeNull();
  });

  it("returns the existing job when a concurrent insert hits the unique key", async () => {
    const existing = exportJob();
    const findByIdempotencyKey = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existing);
    const { countCreatedBetween, enqueue, service } = createService({
      create: jest.fn().mockRejectedValue(new Error("unique")),
      findByIdempotencyKey,
      isUniqueConstraintViolationError: jest.fn().mockReturnValue(true),
    });

    const result = await service.createExport({ idempotencyKey, projectId });

    expect(countCreatedBetween).toHaveBeenCalled();
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(existing.id);
  });
});

describe("ExportService.getExport", () => {
  it("404s when the caller is not the requester", async () => {
    const signGet = jest.fn();
    const { service } = createService({
      getForRequester: jest
        .fn()
        .mockRejectedValue(
          new DomainError(
            "NOT_FOUND",
            ErrorCode.EXPORT_NOT_FOUND,
            ErrorMessage.EXPORT_NOT_FOUND
          )
        ),
      signGet,
    });

    await expect(service.getExport(jobId)).rejects.toMatchObject({
      code: ErrorCode.EXPORT_NOT_FOUND,
    });
    expect(signGet).not.toHaveBeenCalled();
  });

  it("includes a signed download URL when succeeded and unexpired", async () => {
    const objectKey = `${orgId}/exports/${jobId}.csv`;
    const signGet = jest
      .fn()
      .mockResolvedValue("https://minio.test/signed.csv");
    const getForRequester = jest.fn().mockResolvedValue(
      exportJob({
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
        objectKey,
        status: ExportJobStatus.SUCCEEDED,
      })
    );
    const { service } = createService({
      getForRequester,
      signGet,
    });

    const result = await service.getExport(jobId);

    expect(getForRequester).toHaveBeenCalledWith({
      id: jobId,
      requestedById: userId,
    });

    expect(signGet).toHaveBeenCalledWith(objectKey, {
      contentDisposition: 'attachment; filename="export.csv"',
      expiresIn: EXPORT_SIGNED_GET_TTL_SECONDS,
    });
    expect(result.downloadUrl).toBe("https://minio.test/signed.csv");
  });

  it("omits downloadUrl when the object has expired", async () => {
    const signGet = jest.fn();
    const { service } = createService({
      getForRequester: jest.fn().mockResolvedValue(
        exportJob({
          expiresAt: new Date("2020-01-01T00:00:00.000Z"),
          objectKey: `${orgId}/exports/${jobId}.csv`,
          status: ExportJobStatus.SUCCEEDED,
        })
      ),
      signGet,
    });

    const result = await service.getExport(jobId);

    expect(signGet).not.toHaveBeenCalled();
    expect(result.downloadUrl).toBeNull();
  });
});
