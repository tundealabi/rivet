import type { PlanTier } from "../members/member-types";
import { MOCK_ORG_ID } from "../members/mock-members-data";
import type {
  BillingData,
  BillingInterval,
  UpgradeQuote,
} from "./billing-types";
import {
  MOCK_BILLING_DATA,
  MOCK_FREE_BILLING_DATA,
  MOCK_STRIPE_CHECKOUT_URL,
  MOCK_STRIPE_PORTAL_URL,
  mockUpgradeQuote,
} from "./mock-billing-data";

export type CancellationReason =
  "too_expensive" | "missing_features" | "not_using" | "switching" | "other";

/** Per-org billing stores — switching orgs swaps plan, invoices, and usage entirely. */
const billingStores = new Map<string, BillingData>([
  [MOCK_ORG_ID, structuredClone(MOCK_BILLING_DATA)],
  ["org_startup", structuredClone(MOCK_FREE_BILLING_DATA)],
]);

const pendingWebhookByOrg = new Map<string, PlanTier>();
const webhookLagFetchesByOrg = new Map<string, number>();
const WEBHOOK_LAG_FETCHES = 3;

function getStore(orgId: string): BillingData {
  const store = billingStores.get(orgId);
  if (!store) {
    throw new Error(`Unknown org billing context: ${orgId}`);
  }
  return store;
}

function setStore(orgId: string, data: BillingData): void {
  billingStores.set(orgId, data);
}

export function resetBillingMockStore(orgId: string = MOCK_ORG_ID): void {
  if (orgId === MOCK_ORG_ID) {
    billingStores.set(orgId, structuredClone(MOCK_BILLING_DATA));
  } else if (orgId === "org_startup") {
    billingStores.set(orgId, structuredClone(MOCK_FREE_BILLING_DATA));
  }
  pendingWebhookByOrg.delete(orgId);
  webhookLagFetchesByOrg.delete(orgId);
}

export async function fetchBillingMock(orgId: string): Promise<BillingData> {
  await new Promise((resolve) => setTimeout(resolve, 450));

  const pendingPlan = pendingWebhookByOrg.get(orgId);
  if (pendingPlan) {
    const fetches = (webhookLagFetchesByOrg.get(orgId) ?? 0) + 1;
    webhookLagFetchesByOrg.set(orgId, fetches);

    if (fetches >= WEBHOOK_LAG_FETCHES) {
      const current = getStore(orgId);
      setStore(orgId, {
        ...current,
        subscription: {
          ...current.subscription,
          planTier: pendingPlan,
          scheduledDowngrade: null,
          cancelAtPeriodEnd: false,
        },
      });
      pendingWebhookByOrg.delete(orgId);
      webhookLagFetchesByOrg.delete(orgId);
    }
  }

  return structuredClone(getStore(orgId));
}

export async function fetchUpgradeQuoteMock(
  targetTier: PlanTier,
  interval: BillingInterval
): Promise<UpgradeQuote> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return mockUpgradeQuote(targetTier, interval);
}

export async function createStripeCheckoutSessionMock(
  planTier: PlanTier,
  interval: BillingInterval
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const returnUrl = encodeURIComponent(
    `${window.location.origin}/billing?checkout=success&plan=${planTier}`
  );
  return `${MOCK_STRIPE_CHECKOUT_URL}?plan=${planTier}&interval=${interval}&return_url=${returnUrl}`;
}

export async function scheduleDowngradeMock(
  orgId: string,
  targetTier: PlanTier
): Promise<BillingData> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const current = getStore(orgId);
  const effectiveAt =
    current.subscription.renewsAt instanceof Date
      ? current.subscription.renewsAt
      : new Date();

  const updated: BillingData = {
    ...current,
    subscription: {
      ...current.subscription,
      scheduledDowngrade: {
        targetTier,
        effectiveAt,
      },
    },
  };

  setStore(orgId, updated);
  return structuredClone(updated);
}

export async function applyCheckoutSuccessMock(
  orgId: string,
  planTier: PlanTier
): Promise<BillingData> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  pendingWebhookByOrg.set(orgId, planTier);
  webhookLagFetchesByOrg.set(orgId, 0);
  return structuredClone(getStore(orgId));
}

export async function cancelSubscriptionMock(
  orgId: string,
  _reason?: CancellationReason
): Promise<BillingData> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const current = getStore(orgId);
  const updated: BillingData = {
    ...current,
    subscription: {
      ...current.subscription,
      cancelAtPeriodEnd: true,
      scheduledDowngrade: null,
    },
  };

  setStore(orgId, updated);
  return structuredClone(updated);
}

export async function createStripePortalSessionMock(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_STRIPE_PORTAL_URL;
}
