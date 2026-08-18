import { PlanTier } from "@generated/prisma";
import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ApiSuccessResponseWire } from "@rivet/shared/api";
import { ApiResponseState } from "@rivet/shared/enums";
import Stripe from "stripe";
import request from "supertest";
import type { App } from "supertest/types";

import { ENV_KEYS } from "@/common/constants";
import { DatabaseService } from "@/database/database.service";

import { API_PREFIX } from "./helpers/constants";
import { createE2eApp } from "./helpers/e2e-app.helper";
import { registerLoginAndGetOrg } from "./helpers/fixtures/auth";

const WEBHOOK_PATH = `${API_PREFIX}/webhooks/stripe`;

function subscriptionEventPayload(input: {
  customerId: string;
  eventId: string;
  priceId: string;
  subscriptionId: string;
  type: string;
}): string {
  return JSON.stringify({
    id: input.eventId,
    object: "event",
    type: input.type,
    data: {
      object: {
        id: input.subscriptionId,
        object: "subscription",
        customer: input.customerId,
        items: {
          object: "list",
          data: [
            {
              id: "si_test",
              object: "subscription_item",
              price: {
                id: input.priceId,
                object: "price",
              },
            },
          ],
        },
        status: "active",
      },
    },
  });
}

function signPayload(payload: string, secret: string): string {
  return Stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
  });
}

describe("Stripe webhooks (e2e)", () => {
  let app: INestApplication<App>;
  let database: DatabaseService;
  let priceProId: string;
  let webhookSecret: string;

  beforeAll(async () => {
    app = await createE2eApp();
    database = app.get(DatabaseService);

    const config = app.get(ConfigService);
    priceProId = config.getOrThrow<string>(ENV_KEYS.STRIPE_PRICE_PRO_ID);
    webhookSecret = config.getOrThrow<string>(ENV_KEYS.STRIPE_WEBHOOK_SECRET);
  }, 60_000);

  afterAll(async () => {
    await app.close();
  }, 30_000);

  async function seedOrg(label: string, customerId: string) {
    const owner = await registerLoginAndGetOrg(app, label, `${label} Org`);

    await database.client.organization.update({
      where: { id: owner.orgId },
      data: { stripeCustomerId: customerId },
    });

    return owner;
  }

  function postWebhook(payload: string, signature?: string) {
    const req = request(app.getHttpServer())
      .post(WEBHOOK_PATH)
      .set("Content-Type", "application/json");

    if (signature !== undefined) {
      req.set("Stripe-Signature", signature);
    }

    return req.send(payload);
  }

  it("sets PRO on subscription.updated with STRIPE_PRICE_PRO_ID", async () => {
    const customerId = `cus_pro_${Date.now()}`;
    const owner = await seedOrg("webhook-pro", customerId);
    const payload = subscriptionEventPayload({
      customerId,
      eventId: `evt_pro_${Date.now()}`,
      priceId: priceProId,
      subscriptionId: `sub_pro_${Date.now()}`,
      type: "customer.subscription.updated",
    });

    const res = await postWebhook(payload, signPayload(payload, webhookSecret));

    expect(res.status).toBe(200);
    const body = res.body as ApiSuccessResponseWire<{ received: true }>;
    expect(body.state).toBe(ApiResponseState.SUCCESS);
    expect(body.data).toEqual({ received: true });

    const org = await database.client.organization.findUnique({
      where: { id: owner.orgId },
    });

    expect(org?.planTier).toBe(PlanTier.PRO);
    expect(org?.stripeSubscriptionId).toMatch(/^sub_pro_/);
    expect(org?.stripeCustomerId).toBe(customerId);
  });

  it("ignores a subscription.updated with a non-PRO price", async () => {
    const customerId = `cus_other_price_${Date.now()}`;
    const owner = await seedOrg("webhook-other-price", customerId);
    const payload = subscriptionEventPayload({
      customerId,
      eventId: `evt_other_price_${Date.now()}`,
      priceId: "price_not_pro",
      subscriptionId: `sub_other_${Date.now()}`,
      type: "customer.subscription.updated",
    });

    const res = await postWebhook(payload, signPayload(payload, webhookSecret));

    expect(res.status).toBe(200);

    const org = await database.client.organization.findUnique({
      where: { id: owner.orgId },
    });

    expect(org?.planTier).toBe(PlanTier.FREE);
    expect(org?.stripeSubscriptionId).toBeNull();
  });

  it("returns 200 for a duplicate event id and leaves the plan unchanged", async () => {
    const customerId = `cus_dup_${Date.now()}`;
    const owner = await seedOrg("webhook-dup", customerId);
    const subscriptionId = `sub_dup_${Date.now()}`;
    const payload = subscriptionEventPayload({
      customerId,
      eventId: `evt_dup_${Date.now()}`,
      priceId: priceProId,
      subscriptionId,
      type: "customer.subscription.updated",
    });
    const signature = signPayload(payload, webhookSecret);

    await postWebhook(payload, signature).expect(200);

    await database.client.organization.update({
      where: { id: owner.orgId },
      data: { planTier: PlanTier.TEAM },
    });

    const res = await postWebhook(payload, signature);

    expect(res.status).toBe(200);

    const org = await database.client.organization.findUnique({
      where: { id: owner.orgId },
    });

    expect(org?.planTier).toBe(PlanTier.TEAM);
    expect(org?.stripeSubscriptionId).toBe(subscriptionId);
  });

  it("returns 400 for an unsigned payload", async () => {
    const payload = subscriptionEventPayload({
      customerId: "cus_unsigned",
      eventId: `evt_unsigned_${Date.now()}`,
      priceId: priceProId,
      subscriptionId: "sub_unsigned",
      type: "customer.subscription.updated",
    });

    await postWebhook(payload).expect(400);
  });

  it("returns 200 for an unknown Stripe customer", async () => {
    const payload = subscriptionEventPayload({
      customerId: `cus_unknown_${Date.now()}`,
      eventId: `evt_unknown_${Date.now()}`,
      priceId: priceProId,
      subscriptionId: "sub_unknown",
      type: "customer.subscription.updated",
    });

    const res = await postWebhook(payload, signPayload(payload, webhookSecret));

    expect(res.status).toBe(200);
  });

  it("sets FREE and clears stripeSubscriptionId on subscription.deleted", async () => {
    const customerId = `cus_deleted_${Date.now()}`;
    const owner = await seedOrg("webhook-deleted", customerId);
    const subscriptionId = `sub_deleted_${Date.now()}`;

    await database.client.organization.update({
      where: { id: owner.orgId },
      data: {
        planTier: PlanTier.PRO,
        stripeSubscriptionId: subscriptionId,
      },
    });

    const payload = subscriptionEventPayload({
      customerId,
      eventId: `evt_deleted_${Date.now()}`,
      priceId: priceProId,
      subscriptionId,
      type: "customer.subscription.deleted",
    });

    const res = await postWebhook(payload, signPayload(payload, webhookSecret));

    expect(res.status).toBe(200);

    const org = await database.client.organization.findUnique({
      where: { id: owner.orgId },
    });

    expect(org?.planTier).toBe(PlanTier.FREE);
    expect(org?.stripeSubscriptionId).toBeNull();
    expect(org?.stripeCustomerId).toBe(customerId);
  });
});
