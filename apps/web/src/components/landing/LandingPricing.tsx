import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";

import {
  LANDING_PLAN_CTAS,
  LANDING_PLAN_TAGLINES,
  PLAN_CARDS,
} from "../billing/billing-plan-data";
import {
  formatPublicPlanPrice,
  PLAN_DISPLAY_NAMES,
} from "../billing/billing-types";
import { palette } from "./palette";

function PricingCard({ plan }: { plan: (typeof PLAN_CARDS)[number] }) {
  const { amountDisplay, periodDisplay } = formatPublicPlanPrice(plan.tier);
  const name = PLAN_DISPLAY_NAMES[plan.tier];
  const tagline = LANDING_PLAN_TAGLINES[plan.tier];
  const cta = LANDING_PLAN_CTAS[plan.tier];

  return (
    <Box
      flex="1"
      p={{ base: "6", md: "7" }}
      borderRadius="card"
      borderWidth="1px"
      borderColor={
        plan.highlighted ? "rgba(79, 70, 229, 0.35)" : palette.border
      }
      bg={plan.highlighted ? palette.brandSubtle : palette.surface}
      boxShadow={
        plan.highlighted
          ? "0 16px 40px rgba(79, 70, 229, 0.14)"
          : "0 1px 2px rgba(0,0,0,.04)"
      }
      py={{ base: "8", md: plan.highlighted ? "12" : "8" }}
    >
      <Text
        fontSize="sm"
        fontWeight="medium"
        color={plan.highlighted ? palette.brand : palette.fgSecondary}
        mb="2"
      >
        {name}
      </Text>
      <Heading
        color={plan.highlighted ? palette.brand : palette.fg}
        fontSize={{ base: "3xl", md: "4xl" }}
        letterSpacing="-0.02em"
        fontWeight="semibold"
      >
        {amountDisplay}
      </Heading>
      <Text fontSize="xs" color={palette.fgMuted} mt="1" mb="1">
        {periodDisplay}
      </Text>
      <Text fontSize="xs" color={palette.fgMuted} mb="6">
        {tagline}
      </Text>

      <Button
        w="full"
        size="sm"
        borderRadius="badge"
        fontWeight="semibold"
        fontSize="xs"
        bg={plan.highlighted ? palette.brand : "transparent"}
        color={plan.highlighted ? "white" : palette.fg}
        borderWidth={plan.highlighted ? "0" : "1px"}
        borderColor={palette.border}
        _hover={
          plan.highlighted
            ? { bg: palette.brandHover }
            : { bg: palette.brandSubtle, borderColor: palette.brandSoft }
        }
      >
        {cta}
      </Button>

      <Box h="1px" bg={palette.border} my="6" />

      <Stack gap="3.5">
        {plan.features.map((feature) => (
          <Text key={feature} fontSize="xs" color={palette.fgSecondary}>
            {feature}
          </Text>
        ))}
      </Stack>
    </Box>
  );
}

export function LandingPricing() {
  return (
    <Box as="section" id="pricing" py={{ base: "20", md: "28" }} px="6">
      <Heading
        textAlign="center"
        color={palette.fg}
        fontSize={{ base: "3xl", md: "4xl" }}
        letterSpacing="-0.03em"
        fontWeight="medium"
        mb="3"
      >
        Flexible Plans for Everyone
      </Heading>
      <Text
        textAlign="center"
        color={palette.fgMuted}
        fontSize={{ base: "sm", md: "md" }}
        mb={{ base: "12", md: "16" }}
      >
        Choose the plan that best suits your needs and enjoy seamless issue
        tracking.
      </Text>

      <Flex
        maxW="5xl"
        mx="auto"
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        gap="5"
      >
        {PLAN_CARDS.map((plan) => (
          <PricingCard key={plan.tier} plan={plan} />
        ))}
      </Flex>
    </Box>
  );
}
