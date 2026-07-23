import { Box, Flex, Text } from "@chakra-ui/react";
import { PiCheckCircle, PiX } from "react-icons/pi";

import { fadeInUp } from "../issues/issues-motion";
import type { PlanTier } from "../members/member-types";
import { PLAN_DISPLAY_NAMES } from "./billing-types";

interface BillingSuccessBannerProps {
  planTier: PlanTier;
  onDismiss: () => void;
}

export function BillingSuccessBanner({
  planTier,
  onDismiss,
}: BillingSuccessBannerProps) {
  const planName = PLAN_DISPLAY_NAMES[planTier];

  return (
    <Box
      mb="6"
      borderWidth="1px"
      borderColor="billing.success.border"
      borderRadius="card"
      bg="billing.success.bg"
      px="5"
      py="4"
      {...fadeInUp}
    >
      <Flex align="flex-start" justify="space-between" gap="4">
        <Flex align="flex-start" gap="3">
          <Box color="billing.paid.fg" mt="0.5" flexShrink="0">
            <PiCheckCircle size={20} />
          </Box>
          <Box>
            <Text fontWeight="semibold" color="fg.primary" fontSize="sm">
              You&apos;re on {planName}! Welcome.
            </Text>
            <Text fontSize="sm" color="fg.secondary" mt="0.5" lineHeight="1.5">
              Your subscription is active. Stripe will send a receipt to your
              billing email shortly.
            </Text>
          </Box>
        </Flex>
        <Box
          as="button"
          color="fg.muted"
          flexShrink="0"
          _hover={{ color: "fg.secondary" }}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <PiX size={18} />
        </Box>
      </Flex>
    </Box>
  );
}
