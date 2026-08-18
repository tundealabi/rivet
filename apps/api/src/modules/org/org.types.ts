import { PlanTier } from "@generated/prisma";

export interface CreateOrgInput {
  name: string;
}

export interface FindOrgByStripeCustomerIdInput {
  stripeCustomerId: string;
}

export interface UpdateOrgStripeCustomerInput {
  orgId: string;
  stripeCustomerId: string;
}

export interface UpdateOrgBillingFromSubscriptionInput {
  orgId: string;
  planTier: PlanTier;
  stripeSubscriptionId: string | null;
}
