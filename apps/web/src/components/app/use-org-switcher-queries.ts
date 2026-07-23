import { useMutation, useQueryClient } from "@tanstack/react-query";

import { orgSwitcherQueryKeys } from "./org-query-keys";
import {
  acceptOrgInvitationMock,
  createOrganizationMock,
  declineOrgInvitationMock,
} from "./org-switcher-api";
import type { CreateOrganizationInput } from "./org-switcher-types";

export function useCreateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) =>
      createOrganizationMock(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: orgSwitcherQueryKeys.all,
      });
    },
  });
}

export function useAcceptOrgInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => acceptOrgInvitationMock(invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: orgSwitcherQueryKeys.all,
      });
    },
  });
}

export function useDeclineOrgInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      declineOrgInvitationMock(invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: orgSwitcherQueryKeys.all,
      });
    },
  });
}
