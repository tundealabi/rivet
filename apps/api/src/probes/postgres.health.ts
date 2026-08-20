import { Injectable } from "@nestjs/common";
import { HealthIndicatorService } from "@nestjs/terminus";

import { DatabaseService } from "@/database/database.service";

@Injectable()
export class PostgresHealthIndicator {
  constructor(
    private readonly database: DatabaseService,
    private readonly healthIndicatorService: HealthIndicatorService
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.database.ping();
      return indicator.up();
    } catch (error) {
      return indicator.down({
        message:
          error instanceof Error ? error.message : "postgres ping failed",
      });
    }
  }
}
