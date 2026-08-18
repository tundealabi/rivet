import { OrganizationRole, PlanTier } from "@generated/prisma";
import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  ApiGeneralErrorResponseWire,
  ApiSuccessResponseWire,
  BillingCheckoutResponseWire,
  BillingSummaryResponseWire,
} from "@rivet/shared/api";
import { ErrorCode } from "@rivet/shared/enums";
import request from "supertest";
import type { App } from "supertest/types";

import { ENV_KEYS } from "@/common/constants";
import { DatabaseService } from "@/database/database.service";
import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

import { API_PREFIX } from "./helpers/constants";
import { createE2eApp } from "./helpers/e2e-app.helper";
import {
  type RegisteredUser,
  registerLoginAndGetOrg,
} from "./helpers/fixtures/auth";
import { addOrgMember } from "./helpers/fixtures/org-member";

const BILLING_PATH = `${API_PREFIX}/billing`;
const CHECKOUT_PATH = `${BILLING_PATH}/checkout`;
const CHECKOUT_URL = "https://checkout.stripe.com/c/pay/cs_test_e2e";

describe("Billing (e2e)", () => {
  const customersCreate = jest.fn();
  const sessionsCreate = jest.fn();
  const stripeClient = {
    customers: { create: customersCreate },
    checkout: { sessions: { create: sessionsCreate } },
  };

  let app: INestApplication<App>;
  let database: DatabaseService;
  let priceProId: string;
  let webBaseUrl: string;
  let owner: RegisteredUser;
  let admin: RegisteredUser;
  let member: RegisteredUser;
  let viewer: RegisteredUser;
  let otherOrg: RegisteredUser;

  beforeAll(async () => {
    app = await createE2eApp({ stripeClient });
    database = app.get(DatabaseService);

    const config = app.get(ConfigService);
    priceProId = config.getOrThrow<string>(ENV_KEYS.STRIPE_PRICE_PRO_ID);
    webBaseUrl = config.getOrThrow<string>(ENV_KEYS.CLIENT_WEB_BASE_URL);

    owner = await registerLoginAndGetOrg(app, "billing-owner", "Billing Org");
    admin = await registerLoginAndGetOrg(
      app,
      "billing-admin",
      "Billing Admin Own"
    );
    member = await registerLoginAndGetOrg(
      app,
      "billing-member",
      "Billing Member Own"
    );
    viewer = await registerLoginAndGetOrg(
      app,
      "billing-viewer",
      "Billing Viewer Own"
    );
    otherOrg = await registerLoginAndGetOrg(
      app,
      "billing-other",
      "Billing Other Org"
    );

    await addOrgMember(app, {
      orgId: owner.orgId,
      role: OrganizationRole.ADMIN,
      userId: admin.userId,
    });
    await addOrgMember(app, {
      orgId: owner.orgId,
      role: OrganizationRole.MEMBER,
      userId: member.userId,
    });
    await addOrgMember(app, {
      orgId: owner.orgId,
      role: OrganizationRole.VIEWER,
      userId: viewer.userId,
    });
  }, 60_000);

  afterAll(async () => {
    await app.close();
  }, 30_000);

  beforeEach(() => {
    customersCreate.mockReset();
    sessionsCreate.mockReset();
    customersCreate.mockImplementation(() =>
      Promise.resolve({
        id: `cus_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      })
    );
    sessionsCreate.mockResolvedValue({ url: CHECKOUT_URL });
  });

  function authHeaders(user: RegisteredUser, orgId = owner.orgId) {
    return {
      Authorization: `Bearer ${user.accessToken}`,
      [AUTH_CONSTANTS.ORG_ID_HEADER]: orgId,
    };
  }

  async function expectForbidden(req: request.Test): Promise<void> {
    const res = await req.expect(403);
    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.FORBIDDEN);
  }

  async function expectAlreadySubscribed(req: request.Test): Promise<void> {
    const res = await req.expect(409);
    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.BILLING_ALREADY_SUBSCRIBED);
  }

  it("returns 401 for an unauthenticated GET and POST", async () => {
    await request(app.getHttpServer())
      .get(BILLING_PATH)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, owner.orgId)
      .expect(401);

    await request(app.getHttpServer())
      .post(CHECKOUT_PATH)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, owner.orgId)
      .expect(401);
  });

  it("returns { planTier } for a FREE owner and omits Stripe ids", async () => {
    const res = await request(app.getHttpServer())
      .get(BILLING_PATH)
      .set(authHeaders(owner))
      .expect(200);

    const body = res.body as ApiSuccessResponseWire<BillingSummaryResponseWire>;
    expect(body.data).toEqual({ planTier: PlanTier.FREE });
    expect(body.data).not.toHaveProperty("stripeCustomerId");
    expect(body.data).not.toHaveProperty("stripeSubscriptionId");
  });

  it("returns a checkout URL for a FREE owner and persists stripeCustomerId", async () => {
    const subscriber = await registerLoginAndGetOrg(
      app,
      "billing-checkout-free",
      "Billing Checkout Free Org"
    );

    const res = await request(app.getHttpServer())
      .post(CHECKOUT_PATH)
      .set(authHeaders(subscriber, subscriber.orgId))
      .expect(200);

    const body =
      res.body as ApiSuccessResponseWire<BillingCheckoutResponseWire>;
    expect(body.data).toEqual({ url: CHECKOUT_URL });

    const org = await database.client.organization.findUnique({
      where: { id: subscriber.orgId },
    });
    expect(org?.stripeCustomerId).toMatch(/^cus_e2e_/);
    expect(org?.planTier).toBe(PlanTier.FREE);
    expect(org?.stripeSubscriptionId).toBeNull();

    expect(customersCreate).toHaveBeenCalledWith({
      metadata: { orgId: subscriber.orgId },
    });
    expect(sessionsCreate).toHaveBeenCalledWith({
      cancel_url: `${webBaseUrl}/billing?checkout=cancel`,
      client_reference_id: subscriber.orgId,
      customer: org?.stripeCustomerId,
      line_items: [{ price: priceProId, quantity: 1 }],
      mode: "subscription",
      success_url: `${webBaseUrl}/billing?checkout=success`,
    });
  });

  it("reuses the Stripe customer on a second FREE checkout", async () => {
    const subscriber = await registerLoginAndGetOrg(
      app,
      "billing-checkout-reuse",
      "Billing Checkout Reuse Org"
    );

    await request(app.getHttpServer())
      .post(CHECKOUT_PATH)
      .set(authHeaders(subscriber, subscriber.orgId))
      .expect(200);

    const afterCreate = await database.client.organization.findUnique({
      where: { id: subscriber.orgId },
    });
    const existingCustomerId = afterCreate?.stripeCustomerId;
    expect(existingCustomerId).toMatch(/^cus_e2e_/);

    customersCreate.mockClear();
    sessionsCreate.mockClear();

    const res = await request(app.getHttpServer())
      .post(CHECKOUT_PATH)
      .set(authHeaders(subscriber, subscriber.orgId))
      .expect(200);

    const body =
      res.body as ApiSuccessResponseWire<BillingCheckoutResponseWire>;
    expect(body.data.url).toBe(CHECKOUT_URL);

    expect(customersCreate).not.toHaveBeenCalled();
    expect(sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: existingCustomerId })
    );

    const afterReuse = await database.client.organization.findUnique({
      where: { id: subscriber.orgId },
    });
    expect(afterReuse?.stripeCustomerId).toBe(existingCustomerId);
    expect(afterReuse?.planTier).toBe(PlanTier.FREE);
  });

  it("returns 409 on a second checkout after the org is PRO", async () => {
    const subscriber = await registerLoginAndGetOrg(
      app,
      "billing-checkout-pro",
      "Billing Checkout Pro Org"
    );

    await request(app.getHttpServer())
      .post(CHECKOUT_PATH)
      .set(authHeaders(subscriber, subscriber.orgId))
      .expect(200);

    await database.client.organization.update({
      where: { id: subscriber.orgId },
      data: { planTier: PlanTier.PRO, stripeSubscriptionId: "sub_e2e_pro" },
    });

    customersCreate.mockClear();
    sessionsCreate.mockClear();

    await expectAlreadySubscribed(
      request(app.getHttpServer())
        .post(CHECKOUT_PATH)
        .set(authHeaders(subscriber, subscriber.orgId))
    );

    expect(customersCreate).not.toHaveBeenCalled();
    expect(sessionsCreate).not.toHaveBeenCalled();

    const billingRes = await request(app.getHttpServer())
      .get(BILLING_PATH)
      .set(authHeaders(subscriber, subscriber.orgId))
      .expect(200);

    const billingBody =
      billingRes.body as ApiSuccessResponseWire<BillingSummaryResponseWire>;
    expect(billingBody.data).toEqual({ planTier: PlanTier.PRO });
  });

  it("returns 409 when the org is TEAM", async () => {
    const teamOwner = await registerLoginAndGetOrg(
      app,
      "billing-team",
      "Billing Team Org"
    );

    await database.client.organization.update({
      where: { id: teamOwner.orgId },
      data: { planTier: PlanTier.TEAM },
    });

    await expectAlreadySubscribed(
      request(app.getHttpServer())
        .post(CHECKOUT_PATH)
        .set(authHeaders(teamOwner, teamOwner.orgId))
    );

    expect(customersCreate).not.toHaveBeenCalled();
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it("returns 403 for admin, member, and viewer on GET and checkout", async () => {
    for (const user of [admin, member, viewer]) {
      await expectForbidden(
        request(app.getHttpServer()).get(BILLING_PATH).set(authHeaders(user))
      );
      await expectForbidden(
        request(app.getHttpServer()).post(CHECKOUT_PATH).set(authHeaders(user))
      );
    }

    expect(customersCreate).not.toHaveBeenCalled();
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it("does not let org B checkout for org A via x-org-id", async () => {
    await expectForbidden(
      request(app.getHttpServer())
        .post(CHECKOUT_PATH)
        .set(authHeaders(otherOrg, owner.orgId))
    );

    const res = await request(app.getHttpServer())
      .post(CHECKOUT_PATH)
      .set(authHeaders(otherOrg, otherOrg.orgId))
      .expect(200);

    const body =
      res.body as ApiSuccessResponseWire<BillingCheckoutResponseWire>;
    expect(body.data.url).toBe(CHECKOUT_URL);

    expect(customersCreate).toHaveBeenCalledWith({
      metadata: { orgId: otherOrg.orgId },
    });
    expect(sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ client_reference_id: otherOrg.orgId })
    );

    const orgA = await database.client.organization.findUnique({
      where: { id: owner.orgId },
    });
    const orgB = await database.client.organization.findUnique({
      where: { id: otherOrg.orgId },
    });

    expect(orgA?.stripeCustomerId).toBeNull();
    expect(orgB?.stripeCustomerId).toMatch(/^cus_e2e_/);
  });
});
