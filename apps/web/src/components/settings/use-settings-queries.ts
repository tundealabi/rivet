import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteAccountMock,
  deleteOrganizationMock,
  fetchAccountDangerContextMock,
  fetchUserSettingsMock,
  leaveOrganizationMock,
  updateNotificationPreferencesMock,
} from "./settings-api";
import { settingsQueryKeys } from "./settings-query-keys";
import type {
  NotificationPreferences,
  SettingsPageData,
} from "./settings-types";

export function useUserSettings(orgId: string) {
  return useQuery({
    queryKey: settingsQueryKeys.page(orgId),
    queryFn: () => fetchUserSettingsMock(),
    refetchOnWindowFocus: true,
  });
}

export function useUpdateNotificationsMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prefs: NotificationPreferences) =>
      updateNotificationPreferencesMock(prefs),
    onMutate: async (prefs) => {
      await queryClient.cancelQueries({
        queryKey: settingsQueryKeys.page(orgId),
      });
      const previous = queryClient.getQueryData<SettingsPageData>(
        settingsQueryKeys.page(orgId)
      );

      queryClient.setQueryData<SettingsPageData>(
        settingsQueryKeys.page(orgId),
        (prev) => (prev ? { ...prev, notifications: prefs } : prev)
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          settingsQueryKeys.page(orgId),
          context.previous
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.page(orgId),
      });
    },
  });
}

export function useDeleteOrganizationMutation(orgId: string) {
  return useMutation({
    mutationFn: () => deleteOrganizationMock(orgId),
  });
}

export function useDeleteAccountMutation() {
  return useMutation({
    mutationFn: () => deleteAccountMock(),
  });
}

export function useAccountDangerContext(orgId: string) {
  return useQuery({
    queryKey: settingsQueryKeys.accountDanger(orgId),
    queryFn: () => fetchAccountDangerContextMock(orgId),
    refetchOnWindowFocus: true,
  });
}

export function useLeaveOrganizationMutation(orgId: string) {
  return useMutation({
    mutationFn: () => leaveOrganizationMock(orgId),
  });
}
