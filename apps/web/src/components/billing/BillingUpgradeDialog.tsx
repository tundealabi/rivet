import { Button, Dialog, Spinner, Stack, Text } from "@chakra-ui/react";

import type { PlanTier } from "../members/member-types";
import { PLAN_DISPLAY_NAMES, type UpgradeQuote } from "./billing-types";

interface BillingUpgradeDialogProps {
  targetTier: PlanTier | null;
  quote: UpgradeQuote | undefined;
  quoteLoading: boolean;
  open: boolean;
  checkoutLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function BillingUpgradeDialog({
  targetTier,
  quote,
  quoteLoading,
  open,
  checkoutLoading = false,
  onOpenChange,
  onConfirm,
}: BillingUpgradeDialogProps) {
  if (!targetTier) return null;

  const planName = PLAN_DISPLAY_NAMES[targetTier];

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
    >
      <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <Dialog.Positioner>
        <Dialog.Content bg="bg.surface" borderRadius="card" maxW="md" mx="4">
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">
              Upgrade to {planName}?
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="4">
            {quoteLoading ? (
              <Stack align="center" py="4">
                <Spinner size="sm" color="accent.default" />
                <Text fontSize="sm" color="fg.secondary">
                  Fetching price from Stripe…
                </Text>
              </Stack>
            ) : (
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                You&apos;ll be charged{" "}
                <Text as="span" fontWeight="semibold" color="fg.primary">
                  {quote?.amountDisplay ?? "—"}
                </Text>{" "}
                now, prorated for the remaining billing period. Continue?
              </Text>
            )}
          </Dialog.Body>
          <Dialog.Footer px="6" pb="6" pt="0" gap="3">
            <Button
              variant="ghost"
              borderRadius="control"
              onClick={() => onOpenChange(false)}
              disabled={checkoutLoading}
            >
              Cancel
            </Button>
            <Button
              borderRadius="control"
              bg="accent.default"
              color="white"
              _hover={{ bg: "accent.hover" }}
              loading={checkoutLoading}
              disabled={quoteLoading || !quote}
              onClick={onConfirm}
            >
              Continue to checkout
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
