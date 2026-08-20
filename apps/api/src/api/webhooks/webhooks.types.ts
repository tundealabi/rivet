export interface HandleStripeWebhookInput {
  rawBody: Buffer | undefined;
  signature: string | undefined;
}
