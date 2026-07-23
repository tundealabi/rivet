import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  checkSlugAvailabilityMock,
  fetchOrgGeneralSettingsMock,
  fetchOrgNotificationSettingsMock,
  removeOrgLogoMock,
  updateOrgDefaultNotificationEventsMock,
  updateOrgEmailNotificationsEnabledMock,
  updateOrgLocaleMock,
  updateOrgNameMock,
  updateOrgSenderIdentityMock,
  updateOrgSlugMock,
  uploadOrgLogoMock,
} from "./settings-api";
import { settingsQueryKeys } from "./settings-query-keys";
import type {
  DateFormatStyle,
  OrgDefaultNotificationEvents,
} from "./settings-types";

export function useOrgGeneralSettings(orgId: string) {
  return useQuery({
    queryKey: settingsQueryKeys.orgGeneral(orgId),
    queryFn: () => fetchOrgGeneralSettingsMock(orgId),
    refetchOnWindowFocus: true,
  });
}

export function useSlugAvailabilityQuery(
  orgId: string,
  slug: string,
  currentSlug: string,
  enabled: boolean
) {
  return useQuery({
    queryKey: settingsQueryKeys.slugAvailability(orgId, slug),
    queryFn: () => checkSlugAvailabilityMock(orgId, slug, currentSlug),
    enabled: enabled && slug.length >= 2,
    staleTime: 30_000,
  });
}

export function useUpdateOrgNameMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => updateOrgNameMock(orgId, name),
    onMutate: async (name) => {
      await queryClient.cancelQueries({
        queryKey: settingsQueryKeys.orgGeneral(orgId),
      });
      const previous = queryClient.getQueryData(
        settingsQueryKeys.orgGeneral(orgId)
      );

      queryClient.setQueryData(settingsQueryKeys.orgGeneral(orgId), (prev) =>
        prev ? { ...prev, name: name.trim() } : prev
      );

      return { previous };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.orgGeneral(orgId), data);
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          settingsQueryKeys.orgGeneral(orgId),
          context.previous
        );
      }
    },
  });
}

export function useUpdateOrgSlugMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => updateOrgSlugMock(orgId, slug),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.orgGeneral(orgId), data);
    },
  });
}

export function useUploadOrgLogoMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (percent: number) => void;
    }) => uploadOrgLogoMock(orgId, file, onProgress),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.orgGeneral(orgId), data);
    },
  });
}

export function useRemoveOrgLogoMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => removeOrgLogoMock(orgId),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.orgGeneral(orgId), data);
    },
  });
}

export function useUpdateOrgLocaleMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: { timezone?: string; dateFormat?: DateFormatStyle }) =>
      updateOrgLocaleMock(orgId, patch),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.orgGeneral(orgId), data);
    },
  });
}

export function useOrgNotificationSettings(orgId: string) {
  return useQuery({
    queryKey: settingsQueryKeys.orgNotifications(orgId),
    queryFn: () => fetchOrgNotificationSettingsMock(orgId),
    refetchOnWindowFocus: true,
  });
}

export function useUpdateOrgEmailNotificationsEnabledMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emailNotificationsEnabled: boolean) =>
      updateOrgEmailNotificationsEnabledMock(orgId, emailNotificationsEnabled),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.orgNotifications(orgId), data);
    },
  });
}

export function useUpdateOrgDefaultNotificationEventsMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (defaultEvents: OrgDefaultNotificationEvents) =>
      updateOrgDefaultNotificationEventsMock(orgId, defaultEvents),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.orgNotifications(orgId), data);
    },
  });
}

export function useUpdateOrgSenderIdentityMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: { senderName: string; replyToEmail: string | null }) =>
      updateOrgSenderIdentityMock(orgId, patch),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.orgNotifications(orgId), data);
    },
  });
}
