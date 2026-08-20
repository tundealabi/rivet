import { Module } from "@nestjs/common";

import { OrgModule } from "@/modules/org/org.module";
import { StripeModule } from "@/stripe/stripe.module";

import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";

@Module({
  imports: [OrgModule, StripeModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class ApiBillingModule {}
