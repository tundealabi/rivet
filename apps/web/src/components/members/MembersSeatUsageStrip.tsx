import { Box, Flex, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { transition } from "../issues/issues-motion";
import {
  PLAN_LABELS,
  type PlanTier,
  seatProgressPercent,
  seatsRemainingLabel,
} from "./member-types";

const TRACK_COLOR = "#F3F4F6";
const FILL_COLOR = "#A5B4FC";
const FILL_NEAR_LIMIT = "#818CF8";
const OVER_LIMIT_COLOR = "#DC2626";

interface MembersSeatUsageStripProps {
  planTier: PlanTier;
  seatsUsed: number;
  seatLimit: number;
  onUpgrade: () => void;
}

export function MembersSeatUsageStrip({
  planTier,
  seatsUsed,
  seatLimit,
  onUpgrade,
}: MembersSeatUsageStripProps) {
  const overLimit = seatsUsed > seatLimit;
  const atLimit = seatsUsed >= seatLimit;
  const nearLimit = !atLimit && seatsUsed / seatLimit >= 0.8;
  const fillPercent = seatProgressPercent(seatsUsed, seatLimit);
  const remainingLabel = seatsRemainingLabel(seatsUsed, seatLimit);
  const barColor = overLimit
    ? OVER_LIMIT_COLOR
    : nearLimit
      ? FILL_NEAR_LIMIT
      : FILL_COLOR;

  return (
    <Box
      px={{ base: "5", md: "10" }}
      py="2.5"
      borderBottomWidth="1px"
      borderColor="border.divider"
      bg="bg.canvas"
      flexShrink="0"
    >
      <Flex
        align={{ base: "flex-start", sm: "center" }}
        justify="space-between"
        direction={{ base: "column", sm: "row" }}
        gap="2"
        mb="2"
      >
        <Text fontSize="xs" color="fg.muted">
          {PLAN_LABELS[planTier]} · {seatsUsed} of {seatLimit} seats
        </Text>

        <Flex align="center" gap="3">
          <Text
            fontSize="xs"
            color={overLimit ? OVER_LIMIT_COLOR : "fg.muted"}
            transition={transition.base}
          >
            {remainingLabel}
          </Text>
          <Link
            asChild
            fontSize="xs"
            color="accent.default"
            fontWeight="medium"
            _hover={{ textDecoration: "underline" }}
          >
            <RouterLink
              to="/billing"
              onClick={(e) => {
                e.preventDefault();
                onUpgrade();
              }}
            >
              Upgrade
            </RouterLink>
          </Link>
        </Flex>
      </Flex>

      <Box
        h="1"
        borderRadius="full"
        bg={TRACK_COLOR}
        overflow="hidden"
        role="progressbar"
        aria-valuenow={seatsUsed}
        aria-valuemin={0}
        aria-valuemax={seatLimit}
        aria-label={`${seatsUsed} of ${seatLimit} seats used`}
      >
        <Box
          h="full"
          w={`${fillPercent}%`}
          borderRadius="full"
          bg={barColor}
          transition="width 0.35s ease, background-color 0.2s ease"
        />
      </Box>
    </Box>
  );
}
