export const STRIPE_SIGNATURE_HEADER = "stripe-signature";

export const STRIPE_SUBSCRIPTION_UPSERT_EVENT_TYPES = [
  "customer.subscription.created",
  "customer.subscription.updated",
] as const;

export const STRIPE_SUBSCRIPTION_DELETED_EVENT_TYPE =
  "customer.subscription.deleted";

export type StripeSubscriptionUpsertEventType =
  (typeof STRIPE_SUBSCRIPTION_UPSERT_EVENT_TYPES)[number];
