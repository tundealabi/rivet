import { Box, Button, Dialog, Flex, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import type { CancellationReason } from "./billing-api";
import { PLAN_CARDS } from "./billing-plan-data";
import {
  formatShortDate,
  type OrgSubscription,
  PLAN_DISPLAY_NAMES,
} from "./billing-types";

const CANCEL_REASONS: { value: CancellationReason; label: string }[] = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "missing_features", label: "Missing features" },
  { value: "not_using", label: "Not using it" },
  { value: "switching", label: "Switching to another tool" },
  { value: "other", label: "Other" },
];

interface BillingCancelSubscriptionDialogProps {
  subscription: OrgSubscription;
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: CancellationReason) => void;
}

export function BillingCancelSubscriptionDialog({
  subscription,
  open,
  loading = false,
  onOpenChange,
  onConfirm,
}: BillingCancelSubscriptionDialogProps) {
  const [reason, setReason] = useState<CancellationReason | "">("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const planName = PLAN_DISPLAY_NAMES[subscription.planTier];
  const endDate = subscription.renewsAt
    ? formatShortDate(subscription.renewsAt)
    : "the end of your billing period";
  const freeLimits = PLAN_CARDS.find((p) => p.tier === "FREE")?.features ?? [];

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
      role="alertdialog"
    >
      <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <Dialog.Positioner>
        <Dialog.Content bg="bg.surface" borderRadius="card" maxW="lg" mx="4">
          <Dialog.Header pt="6" px="6" pb="0">
            <Dialog.Title color="fg.primary">
              Cancel your subscription?
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body px="6" py="4">
            <Stack gap="3">
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                Your {planName} plan will remain active until {endDate}.
              </Text>
              <Box>
                <Text
                  fontSize="sm"
                  color="fg.secondary"
                  lineHeight="1.6"
                  mb="2"
                >
                  After that, you&apos;ll be moved to Free with these limits:
                </Text>
                <Stack gap="1.5" pl="4">
                  {freeLimits.map((limit) => (
                    <Text
                      key={limit}
                      fontSize="sm"
                      color="fg.secondary"
                      lineHeight="1.5"
                    >
                      · {limit}
                    </Text>
                  ))}
                </Stack>
              </Box>
              <Text fontSize="sm" color="fg.secondary" lineHeight="1.6">
                Your data will not be deleted.
              </Text>

              <Box pt="2">
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color="fg.primary"
                  mb="2"
                >
                  Why are you canceling?{" "}
                  <Text as="span" fontWeight="normal" color="fg.muted">
                    (optional)
                  </Text>
                </Text>
                <Stack gap="2">
                  {CANCEL_REASONS.map((option) => (
                    <Flex key={option.value} align="center" gap="2.5">
                      <input
                        type="radio"
                        name="cancel-reason"
                        value={option.value}
                        checked={reason === option.value}
                        onChange={() => setReason(option.value)}
                        style={{ accentColor: "#4F46E5" }}
                      />
                      <Text fontSize="sm" color="fg.secondary">
                        {option.label}
                      </Text>
                    </Flex>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Dialog.Body>
          <Dialog.Footer px="6" pb="6" pt="0" gap="3">
            <Button
              borderRadius="control"
              bg="accent.default"
              color="white"
              fontWeight="semibold"
              _hover={{ bg: "accent.hover" }}
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Keep my plan
            </Button>
            <Button
              variant="ghost"
              borderRadius="control"
              color="status.error"
              fontWeight="semibold"
              loading={loading}
              onClick={() => onConfirm(reason || undefined)}
            >
              Cancel subscription
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
