import { EXPORTS_JOB_NAME } from "../jobs.constants";
import type { ExportJobPayload } from "./export.types";
import { ExportQueueService } from "./export-queue.service";

const payload: ExportJobPayload = {
  exportJobId: "job-1",
  organizationId: "org-1",
  requestedById: "user-1",
};

describe("ExportQueueService.enqueue", () => {
  it("uses the export job id as the BullMQ job id", async () => {
    const add = jest.fn().mockResolvedValue({ id: payload.exportJobId });
    const service = new ExportQueueService({
      add,
      getJob: jest.fn(),
    } as never);

    await service.enqueue(payload);

    expect(add).toHaveBeenCalledWith(
      EXPORTS_JOB_NAME,
      expect.objectContaining({
        exportJobId: payload.exportJobId,
        organizationId: payload.organizationId,
        requestedById: payload.requestedById,
      }),
      {
        jobId: payload.exportJobId,
      }
    );
  });

  it("returns the existing job when the id is already in the queue", async () => {
    const existing = { id: payload.exportJobId };
    const add = jest
      .fn()
      .mockRejectedValue(
        new Error(`Job ${payload.exportJobId} already exists`)
      );
    const getJob = jest.fn().mockResolvedValue(existing);
    const service = new ExportQueueService({ add, getJob } as never);

    await expect(service.enqueue(payload)).resolves.toBe(existing);
    expect(getJob).toHaveBeenCalledWith(payload.exportJobId);
  });
});
