import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  type DashboardStatPreset,
  fetchDashboardActivityMock,
  fetchDashboardStatCardMock,
} from "./dashboard-api";
import { usesPersonalPulse } from "./dashboard-permissions";
import { dashboardQueryKeys } from "./dashboard-query-keys";
import type { DashboardPulseStats, PulseStat } from "./dashboard-stats";
import type { IssueListPreset } from "./issue-list-presets";
import { getOrgDashboardSnapshot } from "./mock-dashboard-data";

const STAT_CARD_KEYS = ["open", "in_progress", "done_week", "fourth"] as const;
export type StatCardQueryKey = (typeof STAT_CARD_KEYS)[number];

function statPresetForKey(
  key: StatCardQueryKey,
  personalFourthCard: boolean
): DashboardStatPreset {
  if (key === "fourth") {
    return personalFourthCard ? "assigned_me" : "overdue";
  }
  return key;
}

export function useDashboardStatCards(
  orgId: string,
  currentUserName: string,
  role: Parameters<typeof usesPersonalPulse>[0],
  enabled = true
) {
  const personalFourthCard = usesPersonalPulse(role);
  const fourthLabel = personalFourthCard ? "Assigned to me" : "Overdue";

  const results = useQueries({
    queries: STAT_CARD_KEYS.map((key) => ({
      queryKey: dashboardQueryKeys.stat(
        orgId,
        statPresetForKey(key, personalFourthCard)
      ),
      queryFn: () =>
        fetchDashboardStatCardMock(
          orgId,
          statPresetForKey(key, personalFourthCard),
          currentUserName,
          personalFourthCard
        ),
      enabled,
      refetchOnWindowFocus: true,
    })),
  });

  const cardState = useMemo(() => {
    const byKey = Object.fromEntries(
      STAT_CARD_KEYS.map((key, index) => [key, results[index]])
    ) as Record<StatCardQueryKey, (typeof results)[number]>;

    const isInitialLoading = results.some(
      (result) => result.isLoading && !result.data
    );
    const allFailed =
      results.length > 0 &&
      results.every((result) => result.isError && !result.data);

    let stats: DashboardPulseStats | null = null;
    if (results.every((result) => result.data)) {
      stats = {
        open: results[0].data!,
        inProgress: results[1].data!,
        doneThisWeek: results[2].data!,
        fourth: results[3].data!,
        fourthLabel: fourthLabel,
      };
    }

    return { byKey, isInitialLoading, allFailed, stats, fourthLabel };
  }, [results, fourthLabel]);

  return cardState;
}

export function useDashboardActivity(orgId: string, enabled = true) {
  return useQuery({
    queryKey: dashboardQueryKeys.activity(orgId),
    queryFn: () => fetchDashboardActivityMock(orgId),
    enabled,
    refetchOnWindowFocus: true,
  });
}

export function useRetryDashboardStatCard(orgId: string) {
  const queryClient = useQueryClient();

  return async (
    key: StatCardQueryKey,
    currentUserName: string,
    personalFourthCard: boolean
  ): Promise<PulseStat> => {
    const preset = statPresetForKey(key, personalFourthCard);
    const stat = await fetchDashboardStatCardMock(
      orgId,
      preset,
      currentUserName,
      personalFourthCard
    );

    queryClient.setQueryData(dashboardQueryKeys.stat(orgId, preset), stat);
    return stat;
  };
}

export function useDashboardSnapshot(orgId: string) {
  return getOrgDashboardSnapshot(orgId);
}

export function statPresetToFourthNavigate(
  fourthLabel: string
): IssueListPreset {
  return fourthLabel === "Assigned to me" ? "assigned_me" : "overdue";
}

export { STAT_CARD_KEYS };
