import { Injectable } from "@nestjs/common";

import { DbOptions } from "@/database/database.types";

import { StripeEventRepository } from "./stripe-event.repository";
import {
  InsertStripeEventInput,
  InsertStripeEventResult,
} from "./stripe-event.types";

@Injectable()
export class StripeEventService {
  constructor(private readonly stripeEventRepository: StripeEventRepository) {}

  async insert(
    input: InsertStripeEventInput,
    options?: DbOptions
  ): Promise<InsertStripeEventResult> {
    const result = await this.stripeEventRepository.createMany(
      {
        data: [{ id: input.id, type: input.type }],
        skipDuplicates: true,
      },
      options
    );

    return result.count === 0
      ? { outcome: "already_processed" }
      : { outcome: "created" };
  }
}
