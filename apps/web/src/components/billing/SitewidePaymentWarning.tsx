import { Box, Flex, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

interface SitewidePaymentWarningProps {
  onFix?: () => void;
}

/** Subtle sitewide warning when org billing is past due. */
export function SitewidePaymentWarning({ onFix }: SitewidePaymentWarningProps) {
  return (
    <Box
      bg="billing.warning.bg"
      borderBottomWidth="1px"
      borderColor="billing.warning.border"
      px={{ base: "5", md: "10" }}
      py="2.5"
    >
      <Flex
        align="center"
        justify="space-between"
        gap="4"
        maxW="full"
        flexWrap="wrap"
      >
        <Text fontSize="sm" color="billing.warning.fg" lineHeight="1.5">
          Payment failed — update your billing details to keep your workspace
          active.
        </Text>
        {onFix ? (
          <Link
            as="button"
            fontSize="sm"
            color="billing.warning.fg"
            fontWeight="semibold"
            whiteSpace="nowrap"
            _hover={{ textDecoration: "underline" }}
            onClick={onFix}
          >
            Manage in Stripe →
          </Link>
        ) : (
          <RouterLink
            to="/billing"
            style={{
              fontSize: "0.875rem",
              color: "var(--chakra-colors-billing-warning-fg)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Fix in Billing →
          </RouterLink>
        )}
      </Flex>
    </Box>
  );
}
