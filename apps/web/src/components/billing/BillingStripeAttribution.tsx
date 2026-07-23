import { Text } from "@chakra-ui/react";

/** Acknowledges Stripe as the payment source of truth — no pretense of owning the stack. */
export function BillingStripeAttribution() {
  return (
    <Text fontSize="xs" color="fg.muted" mt="8" lineHeight="1.6" maxW="xl">
      Payments and invoices are processed by Stripe. Rivet never stores card
      numbers — manage payment methods and full invoice history in Stripe.
    </Text>
  );
}
