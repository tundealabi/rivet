import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";

import { StripeEventRepository } from "./stripe-event.repository";
import { StripeEventService } from "./stripe-event.service";

@Module({
  imports: [DatabaseModule],
  providers: [StripeEventRepository, StripeEventService],
  exports: [StripeEventService],
})
export class StripeEventModule {}
