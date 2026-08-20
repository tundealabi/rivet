import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import Redis from "ioredis";

import { ENV_KEYS } from "@/common/constants";
import { DatabaseModule } from "@/database/database.module";

import { REDIS_HEALTH_CLIENT } from "./health.constants";
import { HealthController } from "./health.controller";
import { MetricsController } from "./metrics.controller";
import { MetricsBearerGuard } from "./metrics-bearer.guard";
import { PostgresHealthIndicator } from "./postgres.health";
import { RedisHealthIndicator } from "./redis.health";

@Module({
  imports: [TerminusModule, DatabaseModule],
  controllers: [HealthController, MetricsController],
  providers: [
    MetricsBearerGuard,
    PostgresHealthIndicator,
    RedisHealthIndicator,
    {
      provide: REDIS_HEALTH_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis =>
        new Redis(config.getOrThrow<string>(ENV_KEYS.REDIS_URL), {
          commandTimeout: 2000,
          connectTimeout: 2000,
          enableOfflineQueue: false,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        }),
    },
  ],
})
export class ProbeModule {}
