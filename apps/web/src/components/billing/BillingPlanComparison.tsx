import {
  Box,
  Button,
  Collapsible,
  Flex,
  Link,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { PiCheck, PiMinus } from "react-icons/pi";

import { fadeInUp, stagger } from "../issues/issues-motion";
import type { PlanTier } from "../members/member-types";
import {
  COMPARISON_ROWS,
  type ComparisonCell,
  PLAN_CARDS,
} from "./billing-plan-data";
import {
  type BillingData,
  type BillingInterval,
  findPlanPrice,
  isPlanUpgrade,
  PLAN_DISPLAY_NAMES,
} from "./billing-types";
import { BillingDowngradeDialog } from "./BillingDowngradeDialog";
import { BillingIntervalToggle } from "./BillingIntervalToggle";
import { BillingUpgradeDialog } from "./BillingUpgradeDialog";
import {
  startStripeCheckout,
  useScheduleDowngradeMutation,
  useUpgradeQuote,
} from "./use-billing-queries";

const CARD_BORDER = "#ECEEF2";
const FG_PRIMARY = "#111111";
const FG_MUTED = "#52525B";
const CHECK_MUTED = "#A1A1AA";
const PRO_BORDER = "#4F46E5";
const PRO_BG_TINT = "#FAFAFF";

type PlanAction = "current" | "upgrade" | "downgrade";

function planAction(currentTier: PlanTier, cardTier: PlanTier): PlanAction {
  if (currentTier === cardTier) return "current";
  if (isPlanUpgrade(currentTier, cardTier)) return "upgrade";
  return "downgrade";
}

function ctaLabel(action: PlanAction, tier: PlanTier): string {
  const name = PLAN_DISPLAY_NAMES[tier];

  if (action === "current") return "Current plan";
  if (action === "upgrade") return `Upgrade to ${name}`;
  return tier === "FREE" ? "Downgrade" : `Downgrade to ${name}`;
}

function ComparisonCellContent({ cell }: { cell: ComparisonCell }) {
  if (cell.type === "check") {
    return (
      <Flex justify="center">
        <PiCheck size={16} color={CHECK_MUTED} aria-hidden />
      </Flex>
    );
  }

  if (cell.type === "dash") {
    return (
      <Flex justify="center">
        <PiMinus size={16} color={CHECK_MUTED} aria-hidden />
      </Flex>
    );
  }

  return (
    <Text fontSize="sm" color={FG_MUTED} textAlign="center">
      {cell.value}
    </Text>
  );
}

interface BillingPlanCardProps {
  tier: PlanTier;
  features: string[];
  highlighted?: boolean;
  currentTier: PlanTier;
  canManage: boolean;
  amountDisplay: string;
  periodDisplay: string;
  loading?: boolean;
  onAction: (tier: PlanTier, action: PlanAction) => void;
  index: number;
}

function BillingPlanCard({
  tier,
  features,
  highlighted = false,
  currentTier,
  canManage,
  amountDisplay,
  periodDisplay,
  loading = false,
  onAction,
  index,
}: BillingPlanCardProps) {
  const action = planAction(currentTier, tier);
  const label = ctaLabel(action, tier);
  const isCurrent = action === "current";

  return (
    <Box
      position="relative"
      flex="1"
      minW="0"
      borderWidth={highlighted ? "2px" : "1px"}
      borderColor={highlighted ? PRO_BORDER : CARD_BORDER}
      borderRadius="card"
      bg={highlighted ? PRO_BG_TINT : "bg.surface"}
      p={{ base: "5", md: "6" }}
      display="flex"
      flexDirection="column"
      {...fadeInUp}
      {...stagger(index)}
    >
      {highlighted && (
        <Text
          position="absolute"
          top="3"
          right="3"
          fontSize="2xs"
          fontWeight="semibold"
          color="accent.default"
          bg="#EEF2FF"
          px="2"
          py="0.5"
          borderRadius="badge"
          letterSpacing="0.02em"
        >
          Most popular
        </Text>
      )}

      <Box mb="5" pt={highlighted ? "2" : "0"}>
        <Text
          fontSize="lg"
          fontWeight="semibold"
          color={FG_PRIMARY}
          letterSpacing="-0.01em"
        >
          {PLAN_DISPLAY_NAMES[tier]}
        </Text>
        <Flex align="baseline" gap="1.5" mt="2">
          <Text
            fontSize={{ base: "3xl", md: "4xl" }}
            fontWeight="700"
            color={FG_PRIMARY}
            letterSpacing="-0.03em"
            lineHeight="1"
          >
            {amountDisplay}
          </Text>
          <Text fontSize="sm" color={FG_MUTED}>
            {periodDisplay}
          </Text>
        </Flex>
      </Box>

      <Stack gap="2.5" flex="1" mb="6">
        {features.map((feature) => (
          <Flex key={feature} align="flex-start" gap="2.5">
            <Box flexShrink="0" mt="0.5" aria-hidden>
              <PiCheck size={15} color={CHECK_MUTED} />
            </Box>
            <Text fontSize="sm" color={FG_MUTED} lineHeight="1.5">
              {feature}
            </Text>
          </Flex>
        ))}
      </Stack>

      {canManage && (
        <Button
          w="full"
          borderRadius="control"
          fontWeight="semibold"
          fontSize="sm"
          disabled={isCurrent}
          loading={loading}
          variant={action === "downgrade" ? "outline" : "solid"}
          bg={action === "upgrade" ? "accent.default" : undefined}
          color={action === "upgrade" ? "white" : undefined}
          borderColor={action === "downgrade" ? CARD_BORDER : undefined}
          _hover={
            isCurrent
              ? undefined
              : action === "upgrade"
                ? { bg: "accent.hover" }
                : { bg: "bg.surfaceHover" }
          }
          onClick={() => onAction(tier, action)}
        >
          {label}
        </Button>
      )}
    </Box>
  );
}

interface BillingPlanComparisonProps {
  billing: BillingData;
  canManage: boolean;
}

export function BillingPlanComparison({
  billing,
  canManage,
}: BillingPlanComparisonProps) {
  const { subscription, usage, planPrices } = billing;
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>(
    subscription.planTier === "FREE" ? "monthly" : subscription.interval
  );
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState<PlanTier | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [downgradeTarget, setDowngradeTarget] = useState<PlanTier | null>(null);

  const scheduleDowngrade = useScheduleDowngradeMutation();
  const { data: upgradeQuote, isLoading: quoteLoading } = useUpgradeQuote(
    upgradeTarget,
    selectedInterval
  );

  const intervalLocked =
    subscription.planTier !== "FREE" && !subscription.cancelAtPeriodEnd;

  const handlePlanAction = (tier: PlanTier, action: PlanAction) => {
    if (action === "current" || !canManage) return;

    if (action === "downgrade") {
      setDowngradeTarget(tier);
      return;
    }

    setUpgradeTarget(tier);
  };

  const confirmUpgrade = async () => {
    if (!upgradeTarget) return;

    setCheckoutLoading(true);
    try {
      await startStripeCheckout(upgradeTarget, selectedInterval);
    } catch {
      toast.error("Couldn't start checkout — try again");
      setCheckoutLoading(false);
    }
  };

  const confirmDowngrade = () => {
    if (!downgradeTarget) return;

    scheduleDowngrade.mutate(downgradeTarget, {
      onSuccess: () => {
        toast.success(
          `Downgrade to ${PLAN_DISPLAY_NAMES[downgradeTarget]} scheduled for end of billing period`
        );
        setDowngradeTarget(null);
      },
      onError: () => {
        toast.error("Couldn't schedule downgrade — try again");
      },
    });
  };

  return (
    <Box {...fadeInUp}>
      <Text
        fontSize="lg"
        fontWeight="semibold"
        color={FG_PRIMARY}
        letterSpacing="-0.01em"
        mb="1"
      >
        Compare plans
      </Text>
      <Text fontSize="sm" color={FG_MUTED} mb="6">
        Choose the plan that fits your team. Upgrades take effect immediately;
        downgrades apply at the end of your billing period.
      </Text>

      <Box mb="8">
        <BillingIntervalToggle
          value={selectedInterval}
          onChange={setSelectedInterval}
          disabled={intervalLocked}
        />
      </Box>

      <Flex
        direction={{ base: "column", lg: "row" }}
        gap="4"
        align="stretch"
        mb="8"
      >
        {PLAN_CARDS.map((plan, index) => {
          const stripePrice = findPlanPrice(
            planPrices,
            plan.tier,
            selectedInterval
          );

          return (
            <BillingPlanCard
              key={plan.tier}
              tier={plan.tier}
              features={plan.features}
              highlighted={plan.highlighted}
              currentTier={subscription.planTier}
              canManage={canManage}
              amountDisplay={stripePrice?.amountDisplay ?? "—"}
              periodDisplay={stripePrice?.periodDisplay ?? ""}
              loading={checkoutLoading && upgradeTarget === plan.tier}
              onAction={handlePlanAction}
              index={index}
            />
          );
        })}
      </Flex>

      <Collapsible.Root
        open={comparisonOpen}
        onOpenChange={(e) => setComparisonOpen(e.open)}
      >
        <Collapsible.Trigger asChild>
          <Link
            as="button"
            display="inline-flex"
            alignItems="center"
            gap="1"
            fontSize="sm"
            color="accent.default"
            fontWeight="medium"
            _hover={{ textDecoration: "underline" }}
          >
            Compare all features
            <Text as="span" aria-hidden>
              {comparisonOpen ? "↑" : "→"}
            </Text>
          </Link>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <Box
            mt="6"
            borderWidth="1px"
            borderColor={CARD_BORDER}
            borderRadius="card"
            overflow="hidden"
            bg="bg.surface"
          >
            <Box overflowX="auto">
              <Table.Root size="sm" minW="540px">
                <Table.Header>
                  <Table.Row bg="bg.surfaceHover">
                    <Table.ColumnHeader
                      py="3"
                      px="4"
                      fontWeight="medium"
                      color={FG_MUTED}
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="0.04em"
                      w="40%"
                    >
                      Feature
                    </Table.ColumnHeader>
                    {(["FREE", "PRO", "TEAM"] as const).map((tier) => (
                      <Table.ColumnHeader
                        key={tier}
                        py="3"
                        px="4"
                        fontWeight="semibold"
                        color={FG_PRIMARY}
                        fontSize="sm"
                        textAlign="center"
                        w="20%"
                      >
                        {PLAN_DISPLAY_NAMES[tier]}
                      </Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {COMPARISON_ROWS.map((row) => (
                    <Table.Row key={row.feature} borderColor={CARD_BORDER}>
                      <Table.Cell
                        py="3"
                        px="4"
                        fontSize="sm"
                        color={FG_PRIMARY}
                      >
                        {row.feature}
                      </Table.Cell>
                      <Table.Cell py="3" px="4">
                        <ComparisonCellContent cell={row.free} />
                      </Table.Cell>
                      <Table.Cell py="3" px="4">
                        <ComparisonCellContent cell={row.pro} />
                      </Table.Cell>
                      <Table.Cell py="3" px="4">
                        <ComparisonCellContent cell={row.team} />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>

      <BillingUpgradeDialog
        targetTier={upgradeTarget}
        quote={upgradeQuote}
        quoteLoading={quoteLoading}
        open={upgradeTarget !== null}
        checkoutLoading={checkoutLoading}
        onOpenChange={(open) => {
          if (!open) {
            setUpgradeTarget(null);
            setCheckoutLoading(false);
          }
        }}
        onConfirm={() => void confirmUpgrade()}
      />

      <BillingDowngradeDialog
        targetTier={downgradeTarget}
        currentTier={subscription.planTier}
        usage={usage}
        effectiveAt={subscription.renewsAt ?? new Date()}
        open={downgradeTarget !== null}
        loading={scheduleDowngrade.isPending}
        onOpenChange={(open) => {
          if (!open) setDowngradeTarget(null);
        }}
        onConfirm={confirmDowngrade}
      />
    </Box>
  );
}
