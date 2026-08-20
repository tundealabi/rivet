import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@/database/database.service";
import { DbOptions } from "@/database/database.types";
import { StripeEventCreateManyArgs } from "@/generated/prisma/models";

@Injectable()
export class StripeEventRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createMany<T extends StripeEventCreateManyArgs>(
    args: T,
    dbOptions?: DbOptions
  ): Promise<{ count: number }> {
    const client = this.databaseService.resolveClient(dbOptions);
    return client.stripeEvent.createMany(args);
  }
}
