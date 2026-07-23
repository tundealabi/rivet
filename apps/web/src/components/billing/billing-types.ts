import type { PlanTier } from "../members/member-types";

export type BillingInterval = "monthly" | "yearly";

export interface ScheduledDowngrade {
  targetTier: PlanTier;
  effectiveAt: Date;
}

export interface OrgSubscription {
  planTier: PlanTier;
  interval: BillingInterval;
  /** Null for Free plans with no billing cycle. */
  renewsAt: Date | null;
  cancelAtPeriodEnd: boolean;
  pastDue: boolean;
  isTrialing: boolean;
  trialEndsAt: Date | null;
  scheduledDowngrade: ScheduledDowngrade | null;
  /** Stripe-formatted price, e.g. "$29 per month" or "$0". */
  priceDisplay: string;
}

/** Display pricing returned by Stripe — frontend never calculates amounts. */
export interface StripePlanPrice {
  tier: PlanTier;
  interval: BillingInterval;
  amountDisplay: string;
  periodDisplay: string;
}

/** Prorated upgrade charge quote from Stripe Checkout preview. */
export interface UpgradeQuote {
  targetTier: PlanTier;
  amountDisplay: string;
  interval: BillingInterval;
}

export type InvoiceStatus = "paid" | "pending" | "failed";

export interface Invoice {
  id: string;
  date: Date;
  description: string;
  amountDisplay: string;
  status: InvoiceStatus;
  pdfUrl: string;
}

export interface OrgUsageSnapshot {
  projectCount: number;
  memberCount: number;
  /** Used this billing period — from Stripe/API, not computed client-side. */
  exportsUsedThisMonth: number;
}

export interface PaymentMethod {
  brand: "visa" | "mastercard" | "amex" | "unknown";
  last4: string;
  /** Stripe-formatted label, e.g. "Visa ending in 4242". */
  displayLabel: string;
}

export interface BillingData {
  subscription: OrgSubscription;
  usage: OrgUsageSnapshot;
  planPrices: StripePlanPrice[];
  invoices: Invoice[];
  paymentMethod: PaymentMethod | null;
}

export const PLAN_DISPLAY_NAMES: Record<PlanTier, string> = {
  FREE: "Free",
  PRO: "Pro",
  TEAM: "Team",
};

export const YEARLY_DISCOUNT_PERCENT = 17;

export const PLAN_PRICING: Record<
  PlanTier,
  { monthly: number; yearly: number }
> = {
  FREE: { monthly: 0, yearly: 0 },
  PRO: { monthly: 29, yearly: 289 },
  TEAM: { monthly: 99, yearly: 986 },
};

export function formatPublicPlanPrice(
  tier: PlanTier,
  interval: BillingInterval = "monthly"
): { amountDisplay: string; periodDisplay: string } {
  if (tier === "FREE") {
    return { amountDisplay: "$0", periodDisplay: "forever" };
  }

  return {
    amountDisplay: `$${PLAN_PRICING[tier][interval]}`,
    periodDisplay: interval === "monthly" ? "per month" : "per year",
  };
}

export const PLAN_TIER_ORDER: Record<PlanTier, number> = {
  FREE: 0,
  PRO: 1,
  TEAM: 2,
};

export function comparePlanTiers(a: PlanTier, b: PlanTier): number {
  return PLAN_TIER_ORDER[a] - PLAN_TIER_ORDER[b];
}

export function isPlanDowngrade(from: PlanTier, to: PlanTier): boolean {
  return comparePlanTiers(from, to) > 0;
}

export function isPlanUpgrade(from: PlanTier, to: PlanTier): boolean {
  return comparePlanTiers(from, to) < 0;
}

export function findPlanPrice(
  planPrices: StripePlanPrice[],
  tier: PlanTier,
  interval: BillingInterval
): StripePlanPrice | undefined {
  return planPrices.find((p) => p.tier === tier && p.interval === interval);
}

export function formatRenewalLabel(
  renewsAt: Date,
  cancelAtPeriodEnd: boolean
): string {
  const date = renewsAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (cancelAtPeriodEnd) {
    return `Cancels ${date}`;
  }

  return `Renews ${date}`;
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function trialDaysRemaining(
  trialEndsAt: Date,
  now: Date = new Date()
): number {
  const ms = trialEndsAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function formatTrialEndsLabel(daysRemaining: number): string {
  if (daysRemaining <= 0) {
    return "Trial ends today";
  }
  if (daysRemaining === 1) {
    return "Trial ends in 1 day";
  }
  return `Trial ends in ${daysRemaining} days`;
}

export function trialEndsColor(daysRemaining: number): string {
  if (daysRemaining <= 1) {
    return "#DC2626";
  }
  if (daysRemaining <= 3) {
    return "#D97706";
  }
  return "#52525B";
}

export function formatScheduledDowngradeLabel(
  targetTier: PlanTier,
  effectiveAt: Date
): string {
  const planName = PLAN_DISPLAY_NAMES[targetTier];
  return `Downgrading to ${planName} on ${formatShortDate(effectiveAt)}.`;
}

export function formatCanceledLabel(renewsAt: Date): string {
  return `Canceled — active until ${formatShortDate(renewsAt)}`;
}

export function formatInvoiceDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
