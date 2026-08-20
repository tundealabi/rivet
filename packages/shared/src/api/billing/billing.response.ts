import { z } from "zod";

import { PlanTier } from "../../enums/org.enum.js";

export const BillingSummaryResponseSchema = z.object({
  planTier: z.nativeEnum(PlanTier).describe("Current organization plan"),
});

export type BillingSummaryResponseWire = z.infer<
  typeof BillingSummaryResponseSchema
>;

export const BillingCheckoutResponseSchema = z.object({
  url: z.string().url().describe("Stripe Checkout session URL"),
});

export type BillingCheckoutResponseWire = z.infer<
  typeof BillingCheckoutResponseSchema
>;
