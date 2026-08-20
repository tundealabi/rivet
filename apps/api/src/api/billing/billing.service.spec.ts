import { Organization, PlanTier } from "@generated/prisma";
import { ConfigService } from "@nestjs/config";
import { ErrorCode } from "@rivet/shared/enums";

import { DomainError } from "@/common/errors";
import { TenantContextService } from "@/common/services";
import { OrgService } from "@/modules/org/org.service";
import { StripeService } from "@/stripe/stripe.service";

import { BillingService } from "./billing.service";

const orgId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const customerId = "cus_test_1";
const checkoutUrl = "https://checkout.stripe.com/c/pay/cs_test_1";
const webBaseUrl = "http://localhost:3000";

function organization(overrides: Partial<Organization> = {}): Organization {
  return {
    createdAt: new Date("2026-08-15T12:00:00.000Z"),
    id: orgId,
    name: "Acme",
    planTier: PlanTier.FREE,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    updatedAt: new Date("2026-08-15T12:00:00.000Z"),
    ...overrides,
  };
}

function createService(overrides?: {
  createCheckoutSession?: jest.Mock;
  createCustomer?: jest.Mock;
  findById?: jest.Mock;
  updateStripeCustomerId?: jest.Mock;
}) {
  const findById =
    overrides?.findById ?? jest.fn().mockResolvedValue(organization());
  const createCustomer =
    overrides?.createCustomer ??
    jest.fn().mockResolvedValue({ id: customerId });
  const updateStripeCustomerId =
    overrides?.updateStripeCustomerId ??
    jest.fn().mockResolvedValue(organization({ stripeCustomerId: customerId }));
  const createCheckoutSession =
    overrides?.createCheckoutSession ??
    jest.fn().mockResolvedValue({ url: checkoutUrl });

  const service = new BillingService(
    {
      getOrThrow: jest.fn().mockReturnValue(webBaseUrl),
    } as unknown as ConfigService,
    {
      findById,
      updateStripeCustomerId,
    } as unknown as OrgService,
    {
      createCheckoutSession,
      createCustomer,
    } as unknown as StripeService,
    { orgId } as unknown as TenantContextService
  );

  return {
    createCheckoutSession,
    createCustomer,
    findById,
    service,
    updateStripeCustomerId,
  };
}

describe("BillingService", () => {
  describe("getBilling", () => {
    it("returns planTier only", async () => {
      const { service } = createService({
        findById: jest.fn().mockResolvedValue(
          organization({
            planTier: PlanTier.PRO,
            stripeCustomerId: customerId,
            stripeSubscriptionId: "sub_test_1",
          })
        ),
      });

      await expect(service.getBilling()).resolves.toEqual({
        planTier: PlanTier.PRO,
      });
    });

    it("throws NOT_FOUND when the org is missing", async () => {
      const { service } = createService({
        findById: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getBilling()).rejects.toBeInstanceOf(DomainError);
      await expect(service.getBilling()).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
        kind: "NOT_FOUND",
      });
    });
  });

  describe("createCheckout", () => {
    it("creates a customer, persists the id, then creates a session", async () => {
      const {
        createCheckoutSession,
        createCustomer,
        service,
        updateStripeCustomerId,
      } = createService();

      await expect(service.createCheckout()).resolves.toEqual({
        url: checkoutUrl,
      });

      expect(createCustomer).toHaveBeenCalledWith({ orgId });
      expect(updateStripeCustomerId).toHaveBeenCalledWith({
        orgId,
        stripeCustomerId: customerId,
      });
      expect(createCheckoutSession).toHaveBeenCalledWith({
        cancelUrl: `${webBaseUrl}/billing?checkout=cancel`,
        customerId,
        orgId,
        successUrl: `${webBaseUrl}/billing?checkout=success`,
      });
    });

    it("reuses an existing Stripe customer and does not create another", async () => {
      const { createCustomer, service, updateStripeCustomerId } = createService(
        {
          findById: jest
            .fn()
            .mockResolvedValue(organization({ stripeCustomerId: customerId })),
        }
      );

      await expect(service.createCheckout()).resolves.toEqual({
        url: checkoutUrl,
      });

      expect(createCustomer).not.toHaveBeenCalled();
      expect(updateStripeCustomerId).not.toHaveBeenCalled();
    });

    it.each([PlanTier.PRO, PlanTier.TEAM])(
      "throws BILLING_ALREADY_SUBSCRIBED when planTier is %s",
      async (planTier) => {
        const { createCheckoutSession, createCustomer, service } =
          createService({
            findById: jest.fn().mockResolvedValue(organization({ planTier })),
          });

        await expect(service.createCheckout()).rejects.toBeInstanceOf(
          DomainError
        );
        await expect(service.createCheckout()).rejects.toMatchObject({
          code: ErrorCode.BILLING_ALREADY_SUBSCRIBED,
          kind: "CONFLICT",
        });

        expect(createCustomer).not.toHaveBeenCalled();
        expect(createCheckoutSession).not.toHaveBeenCalled();
      }
    );
  });
});
