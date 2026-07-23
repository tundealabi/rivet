import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changePasswordMock,
  fetchUserProfileMock,
  removeUserAvatarMock,
  requestEmailChangeMock,
  updateUserFullNameMock,
  updateUserLocaleMock,
  uploadUserAvatarMock,
} from "./settings-api";
import { settingsQueryKeys } from "./settings-query-keys";
import type { UserLocalePreferences } from "./settings-types";

export function useUserProfile() {
  return useQuery({
    queryKey: settingsQueryKeys.profile(),

    queryFn: () => fetchUserProfileMock(),

    refetchOnWindowFocus: true,
  });
}

export function useUpdateFullNameMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fullName: string) => updateUserFullNameMock(fullName),
    onMutate: async (fullName) => {
      await queryClient.cancelQueries({
        queryKey: settingsQueryKeys.profile(),
      });
      const previous = queryClient.getQueryData(settingsQueryKeys.profile());

      queryClient.setQueryData(settingsQueryKeys.profile(), (prev) =>
        prev ? { ...prev, fullName: fullName.trim() } : prev
      );

      return { previous };
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(settingsQueryKeys.profile(), profile);
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsQueryKeys.profile(), context.previous);
      }
    },
  });
}

export function useRequestEmailChangeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => requestEmailChangeMock(email),

    onSuccess: ({ profile }) => {
      queryClient.setQueryData(settingsQueryKeys.profile(), profile);
    },
  });
}

export function useUploadAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,

      onProgress,
    }: {
      file: File;

      onProgress?: (percent: number) => void;
    }) => uploadUserAvatarMock(file, onProgress),

    onSuccess: (profile) => {
      queryClient.setQueryData(settingsQueryKeys.profile(), profile);
    },
  });
}

export function useRemoveAvatarMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => removeUserAvatarMock(),

    onSuccess: (profile) => {
      queryClient.setQueryData(settingsQueryKeys.profile(), profile);
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      changePasswordMock(current, next),
  });
}

export function useUpdateUserLocaleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<UserLocalePreferences>) =>
      updateUserLocaleMock(patch),

    onSuccess: (profile) => {
      queryClient.setQueryData(settingsQueryKeys.profile(), profile);
    },
  });
}
