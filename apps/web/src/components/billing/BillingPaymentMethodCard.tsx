import { Box, Flex, Link, Text } from "@chakra-ui/react";
import { FaCcVisa } from "react-icons/fa6";
import { PiArrowSquareOut } from "react-icons/pi";

import { fadeInUp } from "../issues/issues-motion";
import type { PaymentMethod } from "./billing-types";

const CARD_BORDER = "#ECEEF2";
const FG_MUTED = "#52525B";

function CardBrandIcon({ brand }: { brand: PaymentMethod["brand"] }) {
  if (brand === "visa") {
    return <FaCcVisa size={22} color="#1A1F71" aria-hidden />;
  }
  return null;
}

interface BillingPaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onUpdate: () => void;
  portalLoading?: boolean;
}

export function BillingPaymentMethodCard({
  paymentMethod,
  onUpdate,
  portalLoading = false,
}: BillingPaymentMethodCardProps) {
  return (
    <Box
      mt="8"
      borderWidth="1px"
      borderColor={CARD_BORDER}
      borderRadius="card"
      bg="bg.surface"
      px={{ base: "5", md: "6" }}
      py="4"
      {...fadeInUp}
    >
      <Flex
        align={{ base: "flex-start", sm: "center" }}
        justify="space-between"
        direction={{ base: "column", sm: "row" }}
        gap="3"
      >
        <Box>
          <Text
            fontSize="xs"
            fontWeight="medium"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="0.04em"
            mb="1.5"
          >
            Payment method
          </Text>
          <Flex align="center" gap="2.5">
            <CardBrandIcon brand={paymentMethod.brand} />
            <Text fontSize="sm" color={FG_MUTED}>
              {paymentMethod.displayLabel}
            </Text>
          </Flex>
        </Box>

        <Link
          as="button"
          display="inline-flex"
          alignItems="center"
          gap="1"
          fontSize="sm"
          color="accent.default"
          fontWeight="medium"
          whiteSpace="nowrap"
          _hover={{ textDecoration: "underline" }}
          aria-disabled={portalLoading}
          opacity={portalLoading ? 0.7 : 1}
          pointerEvents={portalLoading ? "none" : "auto"}
          onClick={onUpdate}
        >
          Update in Stripe
          <PiArrowSquareOut size={14} />
        </Link>
      </Flex>
    </Box>
  );
}
