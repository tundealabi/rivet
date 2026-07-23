import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchSecuritySettingsMock,
  revokeAllOtherSessionsMock,
  revokeSessionMock,
} from "./settings-api";
import { settingsQueryKeys } from "./settings-query-keys";

export function useSecuritySettings() {
  return useQuery({
    queryKey: settingsQueryKeys.security(),
    queryFn: () => fetchSecuritySettingsMock(),
    refetchOnWindowFocus: true,
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => revokeSessionMock(sessionId),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.security(), data);
    },
  });
}

export function useRevokeAllOtherSessionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => revokeAllOtherSessionsMock(),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.security(), data);
    },
  });
}
