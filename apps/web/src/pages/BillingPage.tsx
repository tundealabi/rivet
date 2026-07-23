import { Box, Button, Flex, Heading, Link, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { PiArrowSquareOut, PiSignOut } from "react-icons/pi";
import { useSearchParams } from "react-router-dom";

import { AppSidebar, useLogout } from "../components/app/AppSidebar";
import {
  type CancellationReason,
  createStripePortalSessionMock,
} from "../components/billing/billing-api";
import {
  canManageBilling,
  canViewBilling,
} from "../components/billing/billing-permissions";
import { BillingCancelSubscriptionDialog } from "../components/billing/BillingCancelSubscriptionDialog";
import { BillingCurrentPlanCard } from "../components/billing/BillingCurrentPlanCard";
import { BillingFinalizingBanner } from "../components/billing/BillingFinalizingBanner";
import { BillingInvoicesTable } from "../components/billing/BillingInvoicesTable";
import {
  BillingErrorState,
  BillingPageSkeleton,
  BillingPermissionDeniedState,
} from "../components/billing/BillingPageStates";
import { BillingPastDuePageBanner } from "../components/billing/BillingPastDuePageBanner";
import { BillingPaymentMethodCard } from "../components/billing/BillingPaymentMethodCard";
import { BillingPlanComparison } from "../components/billing/BillingPlanComparison";
import { BillingStripeAttribution } from "../components/billing/BillingStripeAttribution";
import { BillingSuccessBanner } from "../components/billing/BillingSuccessBanner";
import { BillingUsageSummary } from "../components/billing/BillingUsageSummary";
import { useActiveOrg } from "../components/billing/use-active-org";
import {
  useBillingFinalizingPoll,
  useBillingSummary,
  useCancelSubscriptionMutation,
  useCheckoutSuccessMutation,
} from "../components/billing/use-billing-queries";
import { fadeIn } from "../components/issues/issues-motion";
import type { PlanTier } from "../components/members/member-types";
import { MOCK_ROLE } from "../components/members/mock-members-data";

function parseCheckoutPlan(value: string | null): PlanTier | null {
  if (value === "PRO" || value === "TEAM" || value === "FREE") {
    return value;
  }
  return null;
}

export default function BillingPage() {
  const { orgId, orgName } = useActiveOrg();
  const [portalLoading, setPortalLoading] = useState(false);
  const [successPlan, setSuccessPlan] = useState<PlanTier | null>(null);
  const [finalizingPlan, setFinalizingPlan] = useState<PlanTier | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const planComparisonRef = useRef<HTMLDivElement>(null);
  const checkoutHandled = useRef(false);
  const logout = useLogout();
  const [searchParams, setSearchParams] = useSearchParams();

  const canView = canViewBilling(MOCK_ROLE);
  const canManage = canManageBilling(MOCK_ROLE);

  const billingQuery = useBillingSummary(orgId);
  const checkoutSuccess = useCheckoutSuccessMutation(orgId);
  const cancelSubscription = useCancelSubscriptionMutation(orgId);

  const checkoutParam = searchParams.get("checkout");
  const checkoutPlan = parseCheckoutPlan(searchParams.get("plan"));

  const billing = billingQuery.data;
  const isFinalizing = useBillingFinalizingPoll(finalizingPlan, orgId);

  useEffect(() => {
    if (checkoutHandled.current) return;
    if (checkoutParam !== "success" || !checkoutPlan || !canView) return;

    checkoutHandled.current = true;
    checkoutSuccess.mutate(checkoutPlan, {
      onSuccess: () => {
        setFinalizingPlan(checkoutPlan);
        setSearchParams({}, { replace: true });
      },
      onError: () => {
        toast.error(
          "Couldn't confirm your upgrade — refresh to check your plan"
        );
        setSearchParams({}, { replace: true });
      },
    });
  }, [checkoutParam, checkoutPlan, canView, checkoutSuccess, setSearchParams]);

  if (
    finalizingPlan &&
    !isFinalizing &&
    billing?.subscription.planTier === finalizingPlan
  ) {
    setSuccessPlan(finalizingPlan);
    setFinalizingPlan(null);
  }

  const openStripePortal = useCallback(async () => {
    setPortalLoading(true);
    try {
      const url = await createStripePortalSessionMock();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Couldn't open the Stripe portal — try again");
    } finally {
      setPortalLoading(false);
    }
  }, []);

  const scrollToPlanComparison = () => {
    planComparisonRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleConfirmCancel = (reason?: CancellationReason) => {
    cancelSubscription.mutate(reason, {
      onSuccess: () => {
        toast.success(
          "Subscription canceled — your plan stays active until period end"
        );
        setCancelOpen(false);
      },
      onError: () => {
        toast.error("Couldn't cancel subscription — try again");
      },
    });
  };

  if (!canView) {
    return (
      <Flex minH="100svh" bg="bg.canvas">
        <AppSidebar onLogout={logout} />
        <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
          <Flex
            as="header"
            align="center"
            justify="space-between"
            px={{ base: "5", md: "10" }}
            py="5"
            borderBottomWidth="1px"
            borderColor="border.default"
            bg="bg.surface"
            flexShrink="0"
          >
            <Box>
              <Heading size="xl" color="fg.primary" letterSpacing="-0.02em">
                Billing
              </Heading>
            </Box>
            <Button
              display={{ base: "inline-flex", md: "none" }}
              variant="outline"
              size="sm"
              borderRadius="control"
              borderColor="status.error"
              color="status.error"
              onClick={logout}
            >
              <PiSignOut size={16} />
              Log out
            </Button>
          </Flex>
          <Box flex="1" overflow="auto">
            <BillingPermissionDeniedState />
          </Box>
        </Box>
      </Flex>
    );
  }

  const isLoading =
    billingQuery.isLoading || (checkoutSuccess.isPending && !finalizingPlan);
  const isError = billingQuery.isError;
  const showPastDueBanner = billing?.subscription.pastDue === true;

  return (
    <Flex minH="100svh" bg="bg.canvas">
      <AppSidebar onLogout={logout} />
      <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
        <Flex
          as="header"
          align={{ base: "flex-start", md: "center" }}
          justify="space-between"
          direction={{ base: "column", md: "row" }}
          gap={{ base: "4", md: "6" }}
          px={{ base: "5", md: "10" }}
          py="5"
          borderBottomWidth="1px"
          borderColor="border.default"
          bg="bg.surface"
          flexShrink="0"
        >
          <Box>
            <Heading size="xl" color="fg.primary" letterSpacing="-0.02em">
              Billing
            </Heading>
            <Text fontSize="sm" color="fg.secondary" mt="1">
              {orgName} · subscription and invoices
            </Text>
            <Text
              fontSize="xs"
              color="fg.muted"
              mt="1"
              display={{ md: "none" }}
            >
              {orgName}
            </Text>
          </Box>

          <Flex
            align="center"
            gap="4"
            alignSelf={{ base: "stretch", md: "center" }}
            justify={{ base: "space-between", md: "flex-end" }}
          >
            {canManage && (
              <Link
                as="button"
                display="inline-flex"
                alignItems="center"
                gap="1.5"
                fontSize="sm"
                color="accent.default"
                fontWeight="medium"
                whiteSpace="nowrap"
                _hover={{ textDecoration: "underline" }}
                aria-disabled={portalLoading}
                opacity={portalLoading ? 0.7 : 1}
                pointerEvents={portalLoading ? "none" : "auto"}
                onClick={() => void openStripePortal()}
              >
                Manage in Stripe
                <PiArrowSquareOut size={15} />
              </Link>
            )}

            <Button
              display={{ base: "inline-flex", md: "none" }}
              variant="outline"
              size="sm"
              borderRadius="control"
              borderColor="status.error"
              color="status.error"
              onClick={logout}
            >
              <PiSignOut size={16} />
              Log out
            </Button>
          </Flex>
        </Flex>

        {showPastDueBanner && (
          <BillingPastDuePageBanner
            canManage={canManage}
            onFixPayment={() => void openStripePortal()}
          />
        )}

        <Box
          px={{ base: "5", md: "10" }}
          py="8"
          flex="1"
          overflow="auto"
          css={fadeIn}
        >
          {isLoading && <BillingPageSkeleton />}

          {isError && (
            <BillingErrorState onRetry={() => void billingQuery.refetch()} />
          )}

          {!isLoading && !isError && billing && (
            <Box maxW="6xl">
              {isFinalizing && <BillingFinalizingBanner />}

              {successPlan && !isFinalizing && (
                <BillingSuccessBanner
                  planTier={successPlan}
                  onDismiss={() => setSuccessPlan(null)}
                />
              )}

              <BillingCurrentPlanCard
                subscription={billing.subscription}
                canManage={canManage}
                onChangePlan={scrollToPlanComparison}
                onCancelSubscription={() => setCancelOpen(true)}
                onFixPayment={() => void openStripePortal()}
                onReactivate={() => void openStripePortal()}
                onKeepCurrentPlan={() => void openStripePortal()}
              />

              <BillingUsageSummary
                planTier={billing.subscription.planTier}
                usage={billing.usage}
              />

              <Box
                ref={planComparisonRef}
                id="billing-plans"
                scrollMarginTop="6"
                mt="12"
                pt="2"
              >
                <BillingPlanComparison
                  billing={billing}
                  canManage={canManage}
                />
              </Box>

              <BillingInvoicesTable
                invoices={billing.invoices}
                subscription={billing.subscription}
                canManage={canManage}
                onOpenPortal={() => void openStripePortal()}
                portalLoading={portalLoading}
              />

              {billing.paymentMethod && (
                <BillingPaymentMethodCard
                  paymentMethod={billing.paymentMethod}
                  onUpdate={() => void openStripePortal()}
                  portalLoading={portalLoading}
                />
              )}

              <BillingCancelSubscriptionDialog
                subscription={billing.subscription}
                open={cancelOpen}
                loading={cancelSubscription.isPending}
                onOpenChange={setCancelOpen}
                onConfirm={handleConfirmCancel}
              />

              <BillingStripeAttribution />
            </Box>
          )}
        </Box>
      </Box>
    </Flex>
  );
}
