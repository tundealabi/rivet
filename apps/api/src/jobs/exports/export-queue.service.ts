import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job, Queue } from "bullmq";

import { Trace } from "@/observability";

import { EXPORTS_JOB_NAME, EXPORTS_QUEUE } from "../jobs.constants";
import type { ExportJobPayload } from "./export.types";

@Injectable()
export class ExportQueueService {
  constructor(
    @InjectQueue(EXPORTS_QUEUE)
    private readonly queue: Queue<ExportJobPayload>
  ) {}

  enqueue(payload: ExportJobPayload): Promise<Job<ExportJobPayload>> {
    return this.addIdempotent(Trace.injectJobContext(payload));
  }

  private async addIdempotent(
    payload: ExportJobPayload
  ): Promise<Job<ExportJobPayload>> {
    try {
      return await this.queue.add(EXPORTS_JOB_NAME, payload, {
        jobId: payload.exportJobId,
      });
    } catch (error) {
      if (!isDuplicateJobIdError(error)) {
        throw error;
      }

      const existing = await this.queue.getJob(payload.exportJobId);
      if (existing) {
        return existing;
      }

      throw error;
    }
  }
}

function isDuplicateJobIdError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";
  return /already exists/i.test(message);
}
