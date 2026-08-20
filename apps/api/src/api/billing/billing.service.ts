import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  BillingCheckoutResponseWire,
  BillingSummaryResponseWire,
} from "@rivet/shared/api";
import { ErrorCode, ErrorMessage, PlanTier } from "@rivet/shared/enums";

import { ENV_KEYS } from "@/common/constants";
import { DomainError } from "@/common/errors";
import { TenantContextService } from "@/common/services";
import { OrgService } from "@/modules/org/org.service";
import { StripeService } from "@/stripe/stripe.service";

import {
  BILLING_CHECKOUT_CANCEL_PATH,
  BILLING_CHECKOUT_SUCCESS_PATH,
} from "./billing.constants";

@Injectable()
export class BillingService {
  constructor(
    private readonly configService: ConfigService,
    private readonly orgService: OrgService,
    private readonly stripeService: StripeService,
    private readonly tenantContext: TenantContextService
  ) {}

  async getBilling(): Promise<BillingSummaryResponseWire> {
    const organization = await this.requireCurrentOrganization();

    return { planTier: organization.planTier as PlanTier };
  }

  async createCheckout(): Promise<BillingCheckoutResponseWire> {
    const organization = await this.requireCurrentOrganization();

    if ((organization.planTier as PlanTier) !== PlanTier.FREE) {
      throw new DomainError(
        "CONFLICT",
        ErrorCode.BILLING_ALREADY_SUBSCRIBED,
        ErrorMessage.BILLING_ALREADY_SUBSCRIBED
      );
    }

    const orgId = organization.id;
    let customerId = organization.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripeService.createCustomer({ orgId });
      await this.orgService.updateStripeCustomerId({
        orgId,
        stripeCustomerId: customer.id,
      });
      customerId = customer.id;
    }

    const webBaseUrl = this.configService.getOrThrow<string>(
      ENV_KEYS.CLIENT_WEB_BASE_URL
    );

    return this.stripeService.createCheckoutSession({
      cancelUrl: `${webBaseUrl}${BILLING_CHECKOUT_CANCEL_PATH}`,
      customerId,
      orgId,
      successUrl: `${webBaseUrl}${BILLING_CHECKOUT_SUCCESS_PATH}`,
    });
  }

  private async requireCurrentOrganization() {
    const organization = await this.orgService.findById(
      this.tenantContext.orgId
    );

    if (!organization) {
      throw new DomainError(
        "NOT_FOUND",
        ErrorCode.NOT_FOUND,
        ErrorMessage.NOT_FOUND
      );
    }

    return organization;
  }
}
