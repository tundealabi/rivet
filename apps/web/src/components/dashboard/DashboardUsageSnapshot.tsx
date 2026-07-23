import { Box, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import {
  PLAN_LABELS,
  PLAN_SEAT_LIMITS,
  type PlanTier,
  seatProgressPercent,
} from "../members/member-types";

interface DashboardUsageSnapshotProps {
  planTier: PlanTier;
  seatsUsed: number;
}

/** Quiet owner nudge — only surfaces when seats are getting tight. */
export function DashboardUsageSnapshot({
  planTier,
  seatsUsed,
}: DashboardUsageSnapshotProps) {
  const seatLimit = PLAN_SEAT_LIMITS[planTier];
  const ratio = seatsUsed / seatLimit;
  const nearLimit = ratio >= 0.8 && seatsUsed < seatLimit;
  const atLimit = seatsUsed >= seatLimit;

  if (!nearLimit && !atLimit) {
    return null;
  }

  const fillPercent = seatProgressPercent(seatsUsed, seatLimit);
  const seatColor = atLimit
    ? "billing.progress.fillOver"
    : "billing.warning.fg";

  return (
    <Box px={{ base: "1", md: "0" }} py="1">
      <Text fontSize="xs" color="fg.secondary" lineHeight="1.5">
        {PLAN_LABELS[planTier]} ·{" "}
        <Text as="span" color={seatColor}>
          {seatsUsed} of {seatLimit} seats used
        </Text>
        {" · "}
        <RouterLink to="/billing" style={{ textDecoration: "none" }}>
          <Text
            as="span"
            color="accent.default"
            fontWeight="medium"
            _hover={{ textDecoration: "underline" }}
          >
            Manage billing
          </Text>
        </RouterLink>
      </Text>
      <Box
        mt="2"
        h="1"
        borderRadius="full"
        bg="billing.progress.track"
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
          bg={
            atLimit ? "billing.progress.fillOver" : "billing.progress.fillNear"
          }
          transition="width 0.3s ease"
        />
      </Box>
    </Box>
  );
}
