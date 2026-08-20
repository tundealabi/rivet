import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ENV_KEYS } from "@/common/constants";
import { ExportModule } from "@/modules/export/export.module";
import { IssueModule } from "@/modules/issue/issue.module";
import { StorageModule } from "@/storage/storage.module";

import {
  EXPORT_JOB_ATTEMPTS,
  EXPORT_JOB_BACKOFF_MS,
} from "./exports/export.constants";
import { ExportJobProcessor } from "./exports/export-job.processor";
import { ExportQueueService } from "./exports/export-queue.service";
import { EXPORTS_QUEUE } from "./jobs.constants";
import { redisConnectionFromUrl } from "./redis.connection";

@Module({
  imports: [
    ExportModule,
    IssueModule,
    StorageModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: redisConnectionFromUrl(
          config.getOrThrow<string>(ENV_KEYS.REDIS_URL)
        ),
      }),
    }),
    BullModule.registerQueue({
      name: EXPORTS_QUEUE,
      defaultJobOptions: {
        attempts: EXPORT_JOB_ATTEMPTS,
        backoff: {
          delay: EXPORT_JOB_BACKOFF_MS,
          type: "exponential",
        },
      },
    }),
  ],
  providers: [ExportJobProcessor, ExportQueueService],
  exports: [ExportQueueService],
})
export class JobsModule {}
