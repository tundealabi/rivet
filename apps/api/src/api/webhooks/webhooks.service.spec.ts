import { PlanTier } from "@generated/prisma";
import { BadRequestException } from "@nestjs/common";
import { ErrorCode } from "@rivet/shared/enums";
import Stripe from "stripe";

import { DomainError } from "@/common/errors";
import { TenantContextService } from "@/common/services";
import { DatabaseService } from "@/database/database.service";
import { OrgService } from "@/modules/org/org.service";
import { StripeEventService } from "@/modules/stripe-event/stripe-event.service";
import { Metrics } from "@/observability";
import { StripeService } from "@/stripe/stripe.service";

import { WebhooksService } from "./webhooks.service";

const orgId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const customerId = "cus_test_1";
const subscriptionId = "sub_test_1";
const eventId = "evt_test_1";
const proPriceId = "price_pro";

function subscriptionEvent(overrides?: {
  customer?: string;
  eventId?: string;
  priceId?: string;
  type?: string;
}): Stripe.Event {
  return {
    id: overrides?.eventId ?? eventId,
    type: overrides?.type ?? "customer.subscription.updated",
    data: {
      object: {
        id: subscriptionId,
        object: "subscription",
        customer: overrides?.customer ?? customerId,
        items: {
          data: [
            {
              price: { id: overrides?.priceId ?? proPriceId },
            },
          ],
        },
      },
    },
  } as Stripe.Event;
}

function createService(overrides?: {
  constructEvent?: jest.Mock;
  findByStripeCustomerId?: jest.Mock;
  insert?: jest.Mock;
  isProPriceId?: jest.Mock;
  updateBillingFromSubscription?: jest.Mock;
}) {
  const constructEvent =
    overrides?.constructEvent ?? jest.fn().mockReturnValue(subscriptionEvent());
  const isProPriceId =
    overrides?.isProPriceId ??
    jest.fn((priceId: string) => priceId === proPriceId);
  const findByStripeCustomerId =
    overrides?.findByStripeCustomerId ??
    jest.fn().mockResolvedValue({
      id: orgId,
      planTier: PlanTier.FREE,
      stripeCustomerId: customerId,
      stripeSubscriptionId: null,
    });
  const insert =
    overrides?.insert ?? jest.fn().mockResolvedValue({ outcome: "created" });
  const updateBillingFromSubscription =
    overrides?.updateBillingFromSubscription ?? jest.fn().mockResolvedValue({});
  const transaction = jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({})
  );
  const runWithTenantContext = jest.fn(
    async (_context: unknown, fn: () => Promise<unknown>) => fn()
  );

  const service = new WebhooksService(
    {
      client: { $transaction: transaction },
    } as unknown as DatabaseService,
    {
      findByStripeCustomerId,
      updateBillingFromSubscription,
    } as unknown as OrgService,
    { insert } as unknown as StripeEventService,
    { constructEvent, isProPriceId } as unknown as StripeService,
    { runWithTenantContext } as unknown as TenantContextService
  );

  return {
    constructEvent,
    findByStripeCustomerId,
    insert,
    runWithTenantContext,
    service,
    transaction,
    updateBillingFromSubscription,
  };
}

const rawBody = Buffer.from("{}");
const signature = "t=1,v1=sig";

describe("WebhooksService.handleStripeWebhook", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects a missing signature without calling Stripe constructEvent", async () => {
    const { constructEvent, service } = createService();
    const recordStripeWebhook = jest.spyOn(Metrics, "recordStripeWebhook");

    await expect(
      service.handleStripeWebhook({ rawBody, signature: undefined })
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(constructEvent).not.toHaveBeenCalled();
    expect(recordStripeWebhook).toHaveBeenCalledWith("bad_signature");
  });

  it("maps constructEvent failure to 400", async () => {
    const { service } = createService({
      constructEvent: jest.fn(() => {
        throw new Error("bad sig");
      }),
    });

    await expect(
      service.handleStripeWebhook({ rawBody, signature })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("returns without a transaction for an unhandled event type", async () => {
    const { findByStripeCustomerId, service, transaction } = createService({
      constructEvent: jest
        .fn()
        .mockReturnValue(subscriptionEvent({ type: "invoice.paid" })),
    });
    const recordStripeWebhook = jest.spyOn(Metrics, "recordStripeWebhook");

    await expect(
      service.handleStripeWebhook({ rawBody, signature })
    ).resolves.toBeUndefined();

    expect(findByStripeCustomerId).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
    expect(recordStripeWebhook).toHaveBeenCalledWith("ignored");
  });

  it("returns without a transaction when the price is not PRO", async () => {
    const { findByStripeCustomerId, service, transaction } = createService({
      constructEvent: jest
        .fn()
        .mockReturnValue(subscriptionEvent({ priceId: "price_other" })),
    });

    await expect(
      service.handleStripeWebhook({ rawBody, signature })
    ).resolves.toBeUndefined();

    expect(findByStripeCustomerId).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("throws DomainError NOT_FOUND for an unknown customer", async () => {
    const { service, transaction } = createService({
      findByStripeCustomerId: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.handleStripeWebhook({ rawBody, signature })
    ).rejects.toBeInstanceOf(DomainError);
    await expect(
      service.handleStripeWebhook({ rawBody, signature })
    ).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
      kind: "NOT_FOUND",
    });

    expect(transaction).not.toHaveBeenCalled();
  });

  it("inserts the event and sets PRO inside a tenant CLS transaction", async () => {
    const {
      insert,
      runWithTenantContext,
      service,
      transaction,
      updateBillingFromSubscription,
    } = createService();
    const recordStripeWebhook = jest.spyOn(Metrics, "recordStripeWebhook");

    await service.handleStripeWebhook({ rawBody, signature });

    expect(runWithTenantContext).toHaveBeenCalledWith(
      { orgId },
      expect.any(Function)
    );
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(
      { id: eventId, type: "customer.subscription.updated" },
      { tx: {} }
    );
    expect(updateBillingFromSubscription).toHaveBeenCalledWith(
      {
        orgId,
        planTier: PlanTier.PRO,
        stripeSubscriptionId: subscriptionId,
      },
      { tx: {} }
    );
    expect(recordStripeWebhook).toHaveBeenCalledWith("applied");
  });

  it("skips the plan update when the event id is already processed", async () => {
    const { service, updateBillingFromSubscription } = createService({
      insert: jest.fn().mockResolvedValue({ outcome: "already_processed" }),
    });
    const recordStripeWebhook = jest.spyOn(Metrics, "recordStripeWebhook");

    await service.handleStripeWebhook({ rawBody, signature });

    expect(updateBillingFromSubscription).not.toHaveBeenCalled();
    expect(recordStripeWebhook).toHaveBeenCalledWith("already_processed");
  });

  it("sets FREE and clears the subscription id on subscription.deleted", async () => {
    const { insert, service, updateBillingFromSubscription } = createService({
      constructEvent: jest
        .fn()
        .mockReturnValue(
          subscriptionEvent({ type: "customer.subscription.deleted" })
        ),
    });

    await service.handleStripeWebhook({ rawBody, signature });

    expect(insert).toHaveBeenCalledWith(
      { id: eventId, type: "customer.subscription.deleted" },
      { tx: {} }
    );
    expect(updateBillingFromSubscription).toHaveBeenCalledWith(
      {
        orgId,
        planTier: PlanTier.FREE,
        stripeSubscriptionId: null,
      },
      { tx: {} }
    );
  });
});
