import { PlanTier } from "@generated/prisma";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";
import Stripe from "stripe";

import { DomainError } from "@/common/errors";
import { TenantContextService } from "@/common/services";
import { DatabaseService } from "@/database/database.service";
import { OrgService } from "@/modules/org/org.service";
import { StripeEventService } from "@/modules/stripe-event/stripe-event.service";
import { Metrics } from "@/observability";
import { StripeService } from "@/stripe/stripe.service";

import {
  STRIPE_SUBSCRIPTION_DELETED_EVENT_TYPE,
  STRIPE_SUBSCRIPTION_UPSERT_EVENT_TYPES,
  type StripeSubscriptionUpsertEventType,
} from "./webhooks.constants";
import { HandleStripeWebhookInput } from "./webhooks.types";

const SUBSCRIPTION_UPSERT_TYPES = new Set<string>(
  STRIPE_SUBSCRIPTION_UPSERT_EVENT_TYPES
);

@Injectable()
export class WebhooksService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly orgService: OrgService,
    private readonly stripeEventService: StripeEventService,
    private readonly stripeService: StripeService,
    private readonly tenantContext: TenantContextService
  ) {}

  async handleStripeWebhook(input: HandleStripeWebhookInput): Promise<void> {
    const event = this.verifyStripeEvent(input);
    const billingUpdate = this.billingUpdateFromEvent(event);

    if (!billingUpdate) {
      Metrics.recordStripeWebhook("ignored");
      return;
    }

    try {
      const organization = await this.orgService.findByStripeCustomerId({
        stripeCustomerId: billingUpdate.stripeCustomerId,
      });

      if (!organization) {
        Metrics.recordStripeWebhook("ignored");
        throw new DomainError(
          "NOT_FOUND",
          ErrorCode.NOT_FOUND,
          ErrorMessage.NOT_FOUND
        );
      }

      await this.tenantContext.runWithTenantContext(
        { orgId: organization.id },
        () =>
          this.databaseService.client.$transaction(async (tx) => {
            const options = { tx };
            const inserted = await this.stripeEventService.insert(
              { id: event.id, type: event.type },
              options
            );

            if (inserted.outcome === "already_processed") {
              Metrics.recordStripeWebhook("already_processed");
              return;
            }

            await this.orgService.updateBillingFromSubscription(
              {
                orgId: organization.id,
                planTier: billingUpdate.planTier,
                stripeSubscriptionId: billingUpdate.stripeSubscriptionId,
              },
              options
            );
            Metrics.recordStripeWebhook("applied");
          })
      );
    } catch (error) {
      if (!(error instanceof DomainError)) {
        Metrics.recordStripeWebhook("error");
      }

      throw error;
    }
  }

  private verifyStripeEvent(input: HandleStripeWebhookInput): Stripe.Event {
    if (!input.rawBody || !input.signature) {
      throw this.invalidSignatureError();
    }

    try {
      return this.stripeService.constructEvent(input.rawBody, input.signature);
    } catch {
      throw this.invalidSignatureError();
    }
  }

  private billingUpdateFromEvent(event: Stripe.Event): {
    planTier: PlanTier;
    stripeCustomerId: string;
    stripeSubscriptionId: string | null;
  } | null {
    if (event.type === STRIPE_SUBSCRIPTION_DELETED_EVENT_TYPE) {
      const subscription = this.asSubscription(event);

      if (!subscription) {
        return null;
      }

      const stripeCustomerId = this.stripeCustomerId(subscription.customer);

      if (!stripeCustomerId) {
        return null;
      }

      return {
        planTier: PlanTier.FREE,
        stripeCustomerId,
        stripeSubscriptionId: null,
      };
    }

    if (!this.isSubscriptionUpsertType(event.type)) {
      return null;
    }

    const subscription = this.asSubscription(event);

    if (!subscription) {
      return null;
    }

    const stripeCustomerId = this.stripeCustomerId(subscription.customer);
    const priceId = this.subscriptionPriceId(subscription);

    if (
      !stripeCustomerId ||
      !priceId ||
      !this.stripeService.isProPriceId(priceId)
    ) {
      return null;
    }

    return {
      planTier: PlanTier.PRO,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
    };
  }

  private isSubscriptionUpsertType(
    type: string
  ): type is StripeSubscriptionUpsertEventType {
    return SUBSCRIPTION_UPSERT_TYPES.has(type);
  }

  private asSubscription(event: Stripe.Event): Stripe.Subscription | null {
    const object = event.data.object;

    if (!object || typeof object !== "object" || !("object" in object)) {
      return null;
    }

    if (object.object !== "subscription") {
      return null;
    }

    return object;
  }

  private stripeCustomerId(
    customer: Stripe.Subscription["customer"]
  ): string | null {
    if (typeof customer === "string") {
      return customer;
    }

    if (customer && typeof customer === "object" && "id" in customer) {
      return customer.id;
    }

    return null;
  }

  private subscriptionPriceId(
    subscription: Stripe.Subscription
  ): string | null {
    const price = subscription.items?.data[0]?.price;

    if (!price) {
      return null;
    }

    if (typeof price === "string") {
      return price;
    }

    return price.id ?? null;
  }

  private invalidSignatureError(): BadRequestException {
    Metrics.recordStripeWebhook("bad_signature");
    return new BadRequestException({
      code: ErrorCode.VALIDATION_ERROR,
      message: ErrorMessage.VALIDATION_ERROR,
    });
  }
}
