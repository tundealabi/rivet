import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchAccountNotificationSettingsMock,
  updateNotificationPreferencesMock,
} from "./settings-api";
import { settingsQueryKeys } from "./settings-query-keys";
import type { NotificationPreferences } from "./settings-types";

export function useAccountNotificationSettings(orgId: string) {
  return useQuery({
    queryKey: settingsQueryKeys.accountNotifications(orgId),
    queryFn: () => fetchAccountNotificationSettingsMock(orgId),
    refetchOnWindowFocus: true,
  });
}

export function useUpdateAccountNotificationsMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prefs: NotificationPreferences) =>
      updateNotificationPreferencesMock(prefs),
    onMutate: async (prefs) => {
      await queryClient.cancelQueries({
        queryKey: settingsQueryKeys.accountNotifications(orgId),
      });
      const previous = queryClient.getQueryData(
        settingsQueryKeys.accountNotifications(orgId)
      );

      queryClient.setQueryData(
        settingsQueryKeys.accountNotifications(orgId),
        (prev) =>
          prev
            ? {
                ...prev,
                preferences: {
                  ...prefs,
                  events: { ...prefs.events },
                },
              }
            : prev
      );

      return { previous };
    },
    onSuccess: (_prefs, variables) => {
      queryClient.setQueryData(
        settingsQueryKeys.accountNotifications(orgId),
        (prev) =>
          prev
            ? {
                ...prev,
                preferences: {
                  ...variables,
                  events: { ...variables.events },
                },
              }
            : prev
      );
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          settingsQueryKeys.accountNotifications(orgId),
          context.previous
        );
      }
    },
  });
}
