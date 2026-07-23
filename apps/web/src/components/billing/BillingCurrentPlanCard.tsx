import { Badge, Box, Button, Flex, HStack, Link, Text } from "@chakra-ui/react";

import { fadeInUp } from "../issues/issues-motion";
import {
  formatCanceledLabel,
  formatRenewalLabel,
  formatScheduledDowngradeLabel,
  formatTrialEndsLabel,
  type OrgSubscription,
  PLAN_DISPLAY_NAMES,
  trialDaysRemaining,
  trialEndsColor,
} from "./billing-types";

interface BillingCurrentPlanCardProps {
  subscription: OrgSubscription;
  canManage: boolean;
  onChangePlan: () => void;
  onCancelSubscription: () => void;
  onFixPayment: () => void;
  onReactivate: () => void;
  onKeepCurrentPlan: () => void;
}

function PastDueBanner({
  canManage,
  onFixPayment,
}: {
  canManage: boolean;
  onFixPayment: () => void;
}) {
  return (
    <Flex
      align={{ base: "stretch", sm: "center" }}
      justify="space-between"
      direction={{ base: "column", sm: "row" }}
      gap="3"
      px={{ base: "5", md: "6" }}
      py="4"
      bg="billing.error.bg"
      borderBottomWidth="1px"
      borderColor="billing.error.border"
    >
      <Text
        fontSize="sm"
        color="billing.error.fg"
        lineHeight="1.5"
        fontWeight="medium"
      >
        Your last payment failed. Update your payment method to avoid
        interruption.
      </Text>
      {canManage && (
        <Button
          size="sm"
          flexShrink="0"
          borderRadius="control"
          bg="status.error"
          color="white"
          fontWeight="semibold"
          _hover={{ bg: "danger.hover" }}
          onClick={onFixPayment}
        >
          Fix payment
        </Button>
      )}
    </Flex>
  );
}

function CanceledBanner({
  planName,
  endDate,
  canManage,
  onReactivate,
}: {
  planName: string;
  endDate: string;
  canManage: boolean;
  onReactivate: () => void;
}) {
  return (
    <Flex
      align={{ base: "stretch", sm: "center" }}
      justify="space-between"
      direction={{ base: "column", sm: "row" }}
      gap="3"
      px={{ base: "5", md: "6" }}
      py="4"
      bg="billing.warning.bg"
      borderBottomWidth="1px"
      borderColor="billing.warning.border"
    >
      <Text fontSize="sm" color="billing.warning.fg" lineHeight="1.5">
        Your {planName} plan will end on {endDate}. Reactivate to keep your
        features.
      </Text>
      {canManage && (
        <Button
          size="sm"
          flexShrink="0"
          borderRadius="control"
          bg="status.warning"
          color="white"
          fontWeight="semibold"
          _hover={{ bg: "settings.unsaved.fg" }}
          onClick={onReactivate}
        >
          Reactivate
        </Button>
      )}
    </Flex>
  );
}

export function BillingCurrentPlanCard({
  subscription,
  canManage,
  onChangePlan,
  onCancelSubscription,
  onFixPayment,
  onReactivate,
  onKeepCurrentPlan,
}: BillingCurrentPlanCardProps) {
  const planName = PLAN_DISPLAY_NAMES[subscription.planTier];
  const isFree = subscription.planTier === "FREE";
  const priceLabel = subscription.priceDisplay;

  const showRenewal =
    !isFree &&
    !subscription.isTrialing &&
    subscription.renewsAt &&
    !subscription.cancelAtPeriodEnd &&
    !subscription.scheduledDowngrade;

  const trialDays =
    subscription.isTrialing && subscription.trialEndsAt
      ? trialDaysRemaining(subscription.trialEndsAt)
      : null;

  const cancelEndDate =
    subscription.cancelAtPeriodEnd && subscription.renewsAt
      ? subscription.renewsAt.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : null;

  return (
    <Box
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      bg="bg.surface"
      overflow="hidden"
      {...fadeInUp}
    >
      {subscription.pastDue && (
        <PastDueBanner canManage={canManage} onFixPayment={onFixPayment} />
      )}

      {subscription.cancelAtPeriodEnd &&
        subscription.renewsAt &&
        !subscription.pastDue && (
          <CanceledBanner
            planName={planName}
            endDate={cancelEndDate ?? ""}
            canManage={canManage}
            onReactivate={onReactivate}
          />
        )}

      <Box p={{ base: "6", md: "8" }}>
        <Flex
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
          direction={{ base: "column", md: "row" }}
          gap="6"
        >
          <Box>
            <HStack gap="2.5" align="center" flexWrap="wrap">
              <Text
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="700"
                color="fg.primary"
                letterSpacing="-0.02em"
                lineHeight="1.2"
              >
                {planName}
              </Text>
              {subscription.cancelAtPeriodEnd && (
                <Badge
                  px="2"
                  py="0.5"
                  borderRadius="badge"
                  bg="billing.warning.bg"
                  color="billing.warning.fg"
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="none"
                >
                  Canceled
                </Badge>
              )}
              {subscription.scheduledDowngrade && (
                <Badge
                  px="2"
                  py="0.5"
                  borderRadius="badge"
                  bg="billing.warning.bg"
                  color="billing.warning.fg"
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="none"
                >
                  Downgrade scheduled
                </Badge>
              )}
              {subscription.isTrialing && (
                <Badge
                  px="2"
                  py="0.5"
                  borderRadius="badge"
                  bg="brand.subtle"
                  color="accent.default"
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="none"
                >
                  Trial
                </Badge>
              )}
            </HStack>

            <Text fontSize="md" color="fg.primary" mt="2" fontWeight="medium">
              {priceLabel}
            </Text>

            {trialDays !== null && (
              <Text
                fontSize="sm"
                color={trialEndsColor(trialDays)}
                mt="1.5"
                fontWeight={trialDays <= 3 ? "medium" : "normal"}
              >
                {formatTrialEndsLabel(trialDays)}
              </Text>
            )}

            {subscription.cancelAtPeriodEnd && subscription.renewsAt && (
              <Text fontSize="sm" color="fg.secondary" mt="1.5">
                {formatCanceledLabel(subscription.renewsAt)}
              </Text>
            )}

            {showRenewal && subscription.renewsAt && (
              <Text fontSize="sm" color="fg.secondary" mt="1.5">
                {formatRenewalLabel(
                  subscription.renewsAt,
                  subscription.cancelAtPeriodEnd
                )}
              </Text>
            )}

            {subscription.scheduledDowngrade && (
              <Text
                fontSize="sm"
                color="fg.secondary"
                mt="1.5"
                lineHeight="1.5"
              >
                {formatScheduledDowngradeLabel(
                  subscription.scheduledDowngrade.targetTier,
                  subscription.scheduledDowngrade.effectiveAt
                )}{" "}
                {canManage && (
                  <Link
                    as="button"
                    color="accent.default"
                    fontWeight="medium"
                    _hover={{ textDecoration: "underline" }}
                    onClick={onKeepCurrentPlan}
                  >
                    Keep {planName}
                  </Link>
                )}
              </Text>
            )}
          </Box>

          {canManage && (
            <Flex
              direction="column"
              align={{ base: "stretch", md: "flex-end" }}
              gap="2.5"
              flexShrink="0"
            >
              {isFree ? (
                <Button
                  borderRadius="control"
                  bg="accent.default"
                  color="white"
                  fontWeight="semibold"
                  px="6"
                  _hover={{ bg: "accent.hover" }}
                  onClick={onChangePlan}
                >
                  Upgrade
                </Button>
              ) : (
                <>
                  <Button
                    borderRadius="control"
                    bg="accent.default"
                    color="white"
                    fontWeight="semibold"
                    px="6"
                    _hover={{ bg: "accent.hover" }}
                    onClick={onChangePlan}
                  >
                    Change plan
                  </Button>
                  {!subscription.cancelAtPeriodEnd && (
                    <Link
                      as="button"
                      fontSize="sm"
                      color="fg.secondary"
                      fontWeight="medium"
                      textAlign={{ base: "center", md: "right" }}
                      _hover={{
                        color: "fg.secondary",
                        textDecoration: "underline",
                      }}
                      onClick={onCancelSubscription}
                    >
                      Cancel subscription
                    </Link>
                  )}
                </>
              )}
            </Flex>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
