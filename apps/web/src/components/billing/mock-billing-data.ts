import type { PlanTier } from "../members/member-types";
import type {
  BillingData,
  BillingInterval,
  OrgUsageSnapshot,
  StripePlanPrice,
  UpgradeQuote,
} from "./billing-types";

export const MOCK_STRIPE_PORTAL_URL =
  "https://billing.stripe.com/p/login/test_mock_portal";

export const MOCK_STRIPE_CHECKOUT_URL =
  "https://checkout.stripe.com/pay/test_mock_checkout";

/** Stripe-returned display prices — not computed on the frontend. */
export const MOCK_STRIPE_PLAN_PRICES: StripePlanPrice[] = [
  {
    tier: "FREE",
    interval: "monthly",
    amountDisplay: "$0",
    periodDisplay: "forever",
  },
  {
    tier: "FREE",
    interval: "yearly",
    amountDisplay: "$0",
    periodDisplay: "forever",
  },
  {
    tier: "PRO",
    interval: "monthly",
    amountDisplay: "$29",
    periodDisplay: "per month",
  },
  {
    tier: "PRO",
    interval: "yearly",
    amountDisplay: "$289",
    periodDisplay: "per year",
  },
  {
    tier: "TEAM",
    interval: "monthly",
    amountDisplay: "$99",
    periodDisplay: "per month",
  },
  {
    tier: "TEAM",
    interval: "yearly",
    amountDisplay: "$986",
    periodDisplay: "per year",
  },
];

/** Stripe prorated upgrade quotes keyed by target tier + interval. */
const MOCK_UPGRADE_QUOTES: Record<string, UpgradeQuote> = {
  "PRO:monthly": {
    targetTier: "PRO",
    amountDisplay: "$29.00",
    interval: "monthly",
  },
  "PRO:yearly": {
    targetTier: "PRO",
    amountDisplay: "$289.00",
    interval: "yearly",
  },
  "TEAM:monthly": {
    targetTier: "TEAM",
    amountDisplay: "$99.00",
    interval: "monthly",
  },
  "TEAM:yearly": {
    targetTier: "TEAM",
    amountDisplay: "$986.00",
    interval: "yearly",
  },
};

export function mockUpgradeQuote(
  targetTier: PlanTier,
  interval: BillingInterval
): UpgradeQuote {
  return (
    MOCK_UPGRADE_QUOTES[`${targetTier}:${interval}`] ?? {
      targetTier,
      amountDisplay: "$0.00",
      interval,
    }
  );
}

export const MOCK_ORG_USAGE: OrgUsageSnapshot = {
  projectCount: 20,
  memberCount: 25,
  exportsUsedThisMonth: 12,
};

export const MOCK_PAYMENT_METHOD = {
  brand: "visa" as const,
  last4: "4242",
  displayLabel: "Visa ending in 4242",
};

export const MOCK_BILLING_DATA: BillingData = {
  subscription: {
    planTier: "PRO",
    interval: "monthly",
    renewsAt: new Date("2026-03-15T00:00:00"),
    cancelAtPeriodEnd: false,
    pastDue: false,
    isTrialing: false,
    trialEndsAt: null,
    scheduledDowngrade: null,
    priceDisplay: "$29 per month",
  },
  usage: MOCK_ORG_USAGE,
  planPrices: MOCK_STRIPE_PLAN_PRICES,
  paymentMethod: MOCK_PAYMENT_METHOD,
  invoices: [
    {
      id: "inv_001",
      date: new Date("2026-02-15T00:00:00"),
      description: "Pro plan · monthly",
      amountDisplay: "$29.00",
      status: "paid",
      pdfUrl: "https://pay.stripe.com/invoice/test/acct_001/inv_001/pdf",
    },
    {
      id: "inv_002",
      date: new Date("2026-01-15T00:00:00"),
      description: "Pro plan · monthly",
      amountDisplay: "$29.00",
      status: "paid",
      pdfUrl: "https://pay.stripe.com/invoice/test/acct_001/inv_002/pdf",
    },
    {
      id: "inv_003",
      date: new Date("2025-12-15T00:00:00"),
      description: "Pro plan · monthly",
      amountDisplay: "$29.00",
      status: "paid",
      pdfUrl: "https://pay.stripe.com/invoice/test/acct_001/inv_003/pdf",
    },
    {
      id: "inv_004",
      date: new Date("2025-11-15T00:00:00"),
      description: "Pro plan · monthly",
      amountDisplay: "$29.00",
      status: "paid",
      pdfUrl: "https://pay.stripe.com/invoice/test/acct_001/inv_004/pdf",
    },
    {
      id: "inv_005",
      date: new Date("2025-10-15T00:00:00"),
      description: "Pro plan · monthly",
      amountDisplay: "$29.00",
      status: "paid",
      pdfUrl: "https://pay.stripe.com/invoice/test/acct_001/inv_005/pdf",
    },
    {
      id: "inv_006",
      date: new Date("2025-09-15T00:00:00"),
      description: "Pro plan · monthly",
      amountDisplay: "$29.00",
      status: "failed",
      pdfUrl: "https://pay.stripe.com/invoice/test/acct_001/inv_006/pdf",
    },
  ],
};

/** Empty billing state for Free orgs with no payment history. */
export const MOCK_FREE_BILLING_DATA: BillingData = {
  subscription: {
    planTier: "FREE",
    interval: "monthly",
    renewsAt: null,
    cancelAtPeriodEnd: false,
    pastDue: false,
    isTrialing: false,
    trialEndsAt: null,
    scheduledDowngrade: null,
    priceDisplay: "$0",
  },
  usage: { projectCount: 2, memberCount: 3, exportsUsedThisMonth: 1 },
  planPrices: MOCK_STRIPE_PLAN_PRICES,
  paymentMethod: null,
  invoices: [],
};

/** Swap `billingStore` seed in billing-api to preview card states. */
export const MOCK_SUBSCRIPTION_VARIANTS = {
  free: MOCK_FREE_BILLING_DATA,
  trial: {
    ...MOCK_BILLING_DATA,
    subscription: {
      ...MOCK_BILLING_DATA.subscription,
      isTrialing: true,
      trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  },
  pastDue: {
    ...MOCK_BILLING_DATA,
    subscription: {
      ...MOCK_BILLING_DATA.subscription,
      pastDue: true,
    },
  },
  canceled: {
    ...MOCK_BILLING_DATA,
    subscription: {
      ...MOCK_BILLING_DATA.subscription,
      cancelAtPeriodEnd: true,
    },
  },
  downgradeScheduled: {
    ...MOCK_BILLING_DATA,
    subscription: {
      ...MOCK_BILLING_DATA.subscription,
      scheduledDowngrade: {
        targetTier: "FREE" as const,
        effectiveAt: new Date("2026-03-15T00:00:00"),
      },
    },
  },
} satisfies Record<string, BillingData>;
