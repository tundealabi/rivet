export interface CreateStripeCustomerInput {
  orgId: string;
}

export interface CreateStripeCheckoutSessionInput {
  cancelUrl: string;
  customerId: string;
  orgId: string;
  successUrl: string;
}

export interface StripeCheckoutSessionResult {
  url: string;
}

export interface StripeCustomerResult {
  id: string;
}
