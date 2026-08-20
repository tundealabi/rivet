import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";

import { SkipAllThrottlers, SkipApiEnvelope } from "@/common/decorators";

import { PostgresHealthIndicator } from "./postgres.health";
import { RedisHealthIndicator } from "./redis.health";

@Controller({ version: VERSION_NEUTRAL })
@ApiExcludeController()
@SkipAllThrottlers()
@SkipApiEnvelope()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly postgres: PostgresHealthIndicator,
    private readonly redis: RedisHealthIndicator
  ) {}

  @Get("health")
  @HealthCheck({ swaggerDocumentation: false })
  liveness() {
    return this.health.check([]);
  }

  @Get("ready")
  @HealthCheck({ swaggerDocumentation: false })
  readiness() {
    return this.health.check([
      () => this.postgres.isHealthy("postgres"),
      () => this.redis.isHealthy("redis"),
    ]);
  }
}
