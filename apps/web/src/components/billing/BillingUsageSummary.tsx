import { Box, Flex, Text } from "@chakra-ui/react";

import { fadeInUp } from "../issues/issues-motion";
import type { PlanTier } from "../members/member-types";
import { PLAN_LIMITS } from "./billing-plan-data";
import type { OrgUsageSnapshot } from "./billing-types";

const BAR_HEIGHT = "7px";

interface UsageMetricProps {
  label: string;
  used: number;
  limit: number | null;
}

function UsageMetric({ label, used, limit }: UsageMetricProps) {
  const unlimited = limit === null;
  const overLimit = !unlimited && used > limit;
  const atLimit = !unlimited && used >= limit;
  const nearLimit = !unlimited && !atLimit && limit > 0 && used / limit >= 0.8;
  const fillPercent = unlimited ? 0 : Math.min(100, (used / limit) * 100);

  const fillColor = overLimit
    ? "billing.progress.fillOver"
    : nearLimit
      ? "billing.progress.fillNear"
      : "billing.progress.fill";

  return (
    <Box
      flex="1"
      minW="0"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surface"
      p="5"
    >
      <Text
        fontSize="xs"
        fontWeight="medium"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="0.04em"
        mb="2"
      >
        {label}
      </Text>
      <Flex align="baseline" gap="1.5" mb="3">
        <Text
          fontSize="2xl"
          fontWeight="700"
          color="fg.primary"
          letterSpacing="-0.03em"
          lineHeight="1"
        >
          {used}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          {unlimited ? "Unlimited" : `of ${limit}`}
        </Text>
      </Flex>
      {!unlimited && (
        <Box
          h={BAR_HEIGHT}
          borderRadius="full"
          bg="billing.progress.track"
          overflow="hidden"
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-label={`${used} of ${limit} ${label.toLowerCase()} used`}
        >
          <Box
            h="full"
            w={`${fillPercent}%`}
            borderRadius="full"
            bg={fillColor}
            transition="width 0.35s ease, background-color 0.2s ease"
          />
        </Box>
      )}
    </Box>
  );
}

interface BillingUsageSummaryProps {
  planTier: PlanTier;
  usage: OrgUsageSnapshot;
}

export function BillingUsageSummary({
  planTier,
  usage,
}: BillingUsageSummaryProps) {
  const limits = PLAN_LIMITS[planTier];

  return (
    <Box mt="8" {...fadeInUp}>
      <Text
        fontSize="lg"
        fontWeight="semibold"
        color="fg.primary"
        letterSpacing="-0.01em"
        mb="1"
      >
        Usage
      </Text>
      <Text fontSize="sm" color="fg.secondary" mb="4">
        Plan limits for this organization — enforced across projects, members,
        and exports.
      </Text>
      <Flex gap="4" direction={{ base: "column", sm: "row" }}>
        <UsageMetric
          label="Projects"
          used={usage.projectCount}
          limit={limits.projects}
        />
        <UsageMetric
          label="Members"
          used={usage.memberCount}
          limit={limits.members}
        />
        <UsageMetric
          label="CSV exports"
          used={usage.exportsUsedThisMonth}
          limit={limits.exportsPerMonth}
        />
      </Flex>
    </Box>
  );
}
