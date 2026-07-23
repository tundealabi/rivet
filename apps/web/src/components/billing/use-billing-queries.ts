import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import type { PlanTier } from "../members/member-types";
import {
  applyCheckoutSuccessMock,
  type CancellationReason,
  cancelSubscriptionMock,
  createStripeCheckoutSessionMock,
  fetchBillingMock,
  fetchUpgradeQuoteMock,
  scheduleDowngradeMock,
} from "./billing-api";
import { billingQueryKeys } from "./billing-query-keys";
import type { BillingData, BillingInterval } from "./billing-types";
import { useActiveOrg } from "./use-active-org";

const FINALIZING_POLL_MS = 3000;

export function useBillingSummary(orgId?: string) {
  const { orgId: activeOrgId } = useActiveOrg();
  const resolvedOrgId = orgId ?? activeOrgId;

  return useQuery({
    queryKey: billingQueryKeys.summary(resolvedOrgId),
    queryFn: () => fetchBillingMock(resolvedOrgId),
    refetchOnWindowFocus: true,
  });
}

export function useBillingFinalizingPoll(
  pendingPlan: PlanTier | null,
  orgId?: string
) {
  const { orgId: activeOrgId } = useActiveOrg();
  const resolvedOrgId = orgId ?? activeOrgId;
  const queryClient = useQueryClient();
  const intervalRef = useRef<number | null>(null);

  const billing = queryClient.getQueryData<BillingData>(
    billingQueryKeys.summary(resolvedOrgId)
  );
  const isFinalizing =
    pendingPlan !== null && billing?.subscription.planTier !== pendingPlan;

  useEffect(() => {
    if (!isFinalizing) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      void queryClient.invalidateQueries({
        queryKey: billingQueryKeys.summary(resolvedOrgId),
      });
    }, FINALIZING_POLL_MS);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isFinalizing, resolvedOrgId, queryClient]);

  return isFinalizing;
}

export function useUpgradeQuote(
  targetTier: PlanTier | null,
  interval: BillingInterval
) {
  return useQuery({
    queryKey: ["billing", "upgrade-quote", targetTier, interval] as const,
    queryFn: () => fetchUpgradeQuoteMock(targetTier!, interval),
    enabled: targetTier !== null && targetTier !== "FREE",
  });
}

export function useScheduleDowngradeMutation(orgId?: string) {
  const { orgId: activeOrgId } = useActiveOrg();
  const resolvedOrgId = orgId ?? activeOrgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetTier: PlanTier) =>
      scheduleDowngradeMock(resolvedOrgId, targetTier),
    onSuccess: (data) => {
      queryClient.setQueryData<BillingData>(
        billingQueryKeys.summary(resolvedOrgId),
        data
      );
    },
  });
}

export function useCheckoutSuccessMutation(orgId?: string) {
  const { orgId: activeOrgId } = useActiveOrg();
  const resolvedOrgId = orgId ?? activeOrgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planTier: PlanTier) =>
      applyCheckoutSuccessMock(resolvedOrgId, planTier),
    onSuccess: (data) => {
      queryClient.setQueryData<BillingData>(
        billingQueryKeys.summary(resolvedOrgId),
        data
      );
    },
  });
}

export function useCancelSubscriptionMutation(orgId?: string) {
  const { orgId: activeOrgId } = useActiveOrg();
  const resolvedOrgId = orgId ?? activeOrgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason?: CancellationReason) =>
      cancelSubscriptionMock(resolvedOrgId, reason),
    onSuccess: (data) => {
      queryClient.setQueryData<BillingData>(
        billingQueryKeys.summary(resolvedOrgId),
        data
      );
    },
  });
}

export async function startStripeCheckout(
  planTier: PlanTier,
  interval: BillingInterval
): Promise<void> {
  const url = await createStripeCheckoutSessionMock(planTier, interval);
  window.location.href = url;
}

export type { CancellationReason };
