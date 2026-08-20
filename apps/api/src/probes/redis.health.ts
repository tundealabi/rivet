import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { HealthIndicatorService } from "@nestjs/terminus";
import type Redis from "ioredis";

import { REDIS_HEALTH_CLIENT } from "./health.constants";

@Injectable()
export class RedisHealthIndicator implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_HEALTH_CLIENT) private readonly redis: Redis,
    private readonly healthIndicatorService: HealthIndicatorService
  ) {}

  async onModuleDestroy(): Promise<void> {
    if (
      this.redis.status === "wait" ||
      this.redis.status === "end" ||
      this.redis.status === "close"
    ) {
      this.redis.disconnect();
      return;
    }

    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      if (this.redis.status === "wait") {
        await this.redis.connect();
      }

      const pong = await this.redis.ping();

      if (pong !== "PONG") {
        return indicator.down({ message: "unexpected ping response" });
      }

      return indicator.up();
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : "redis ping failed",
      });
    }
  }
}
