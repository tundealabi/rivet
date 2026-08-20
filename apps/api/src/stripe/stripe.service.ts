import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

import { ENV_KEYS } from "@/common/constants";

import { STRIPE_CLIENT } from "./stripe.constants";
import {
  CreateStripeCheckoutSessionInput,
  CreateStripeCustomerInput,
  StripeCheckoutSessionResult,
  StripeCustomerResult,
} from "./stripe.types";

@Injectable()
export class StripeService {
  private readonly priceProId: string;
  private readonly webhookSecret: string;

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    configService: ConfigService
  ) {
    this.priceProId = configService.getOrThrow<string>(
      ENV_KEYS.STRIPE_PRICE_PRO_ID
    );
    this.webhookSecret = configService.getOrThrow<string>(
      ENV_KEYS.STRIPE_WEBHOOK_SECRET
    );
  }

  constructEvent(rawBody: Buffer | string, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret
    );
  }

  async createCustomer(
    input: CreateStripeCustomerInput
  ): Promise<StripeCustomerResult> {
    const customer = await this.stripe.customers.create({
      metadata: { orgId: input.orgId },
    });

    return { id: customer.id };
  }

  async createCheckoutSession(
    input: CreateStripeCheckoutSessionInput
  ): Promise<StripeCheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      cancel_url: input.cancelUrl,
      client_reference_id: input.orgId,
      customer: input.customerId,
      line_items: [{ price: this.priceProId, quantity: 1 }],
      mode: "subscription",
      success_url: input.successUrl,
    });

    if (!session.url) {
      throw new Error("Stripe Checkout session did not return a URL");
    }

    return { url: session.url };
  }

  isProPriceId(priceId: string): boolean {
    return priceId === this.priceProId;
  }
}
