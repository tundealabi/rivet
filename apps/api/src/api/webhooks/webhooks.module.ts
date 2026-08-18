import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";
import { OrgModule } from "@/modules/org/org.module";
import { StripeEventModule } from "@/modules/stripe-event/stripe-event.module";
import { StripeModule } from "@/stripe/stripe.module";

import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";

@Module({
  imports: [DatabaseModule, OrgModule, StripeEventModule, StripeModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class ApiWebhooksModule {}
