import { OrganizationRole } from "@rivet/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { PendingInvite } from "./member-types";
import {
  fetchMembersMock,
  MemberNotFoundError,
  type MembersPageData,
  sendInvitesMock,
  updateMemberRoleMock,
} from "./members-api";
import { membersQueryKeys, orgPeopleQueryKeys } from "./members-query-keys";
import { MOCK_MEMBERS, MOCK_PENDING_INVITES } from "./mock-members-data";

function invalidateOrgPeopleQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string
) {
  void queryClient.invalidateQueries({
    queryKey: membersQueryKeys.roster(orgId),
  });
  void queryClient.invalidateQueries({
    queryKey: orgPeopleQueryKeys.assignees(orgId),
  });
  void queryClient.invalidateQueries({
    queryKey: orgPeopleQueryKeys.mentions(orgId),
  });
}

export function useMembersRoster(orgId: string) {
  return useQuery({
    queryKey: membersQueryKeys.roster(orgId),
    queryFn: () => fetchMembersMock(orgId, MOCK_MEMBERS, MOCK_PENDING_INVITES),
    refetchOnWindowFocus: true,
  });
}

export function useSendInvitesMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invites: PendingInvite[]) => sendInvitesMock(invites),
    onSuccess: (sent) => {
      queryClient.setQueryData<MembersPageData>(
        membersQueryKeys.roster(orgId),
        (prev) =>
          prev ? { ...prev, invites: [...prev.invites, ...sent] } : prev
      );
      invalidateOrgPeopleQueries(queryClient, orgId);
    },
  });
}

export function useUpdateMemberRoleMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      role,
    }: {
      memberId: string;
      role: OrganizationRole;
    }) => updateMemberRoleMock(memberId, role),
    onMutate: async ({ memberId, role }) => {
      await queryClient.cancelQueries({
        queryKey: membersQueryKeys.roster(orgId),
      });
      const previous = queryClient.getQueryData<MembersPageData>(
        membersQueryKeys.roster(orgId)
      );

      queryClient.setQueryData<MembersPageData>(
        membersQueryKeys.roster(orgId),
        (prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.map((member) =>
                  member.id === memberId ? { ...member, role } : member
                ),
              }
            : prev
      );

      return { previous };
    },
    onError: (error, _vars, context) => {
      if (error instanceof MemberNotFoundError) {
        queryClient.setQueryData<MembersPageData>(
          membersQueryKeys.roster(orgId),
          (prev) =>
            prev
              ? {
                  ...prev,
                  members: prev.members.filter(
                    (member) => member.id !== _vars.memberId
                  ),
                }
              : prev
        );
        invalidateOrgPeopleQueries(queryClient, orgId);
        return;
      }

      if (context?.previous) {
        queryClient.setQueryData(
          membersQueryKeys.roster(orgId),
          context.previous
        );
      }
    },
    onSuccess: () => {
      invalidateOrgPeopleQueries(queryClient, orgId);
    },
  });
}

export function useRemoveMemberMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => Promise.resolve(memberId),
    onSuccess: (memberId) => {
      queryClient.setQueryData<MembersPageData>(
        membersQueryKeys.roster(orgId),
        (prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.filter(
                  (member) => member.id !== memberId
                ),
              }
            : prev
      );
      invalidateOrgPeopleQueries(queryClient, orgId);
    },
  });
}

export function useRevokeInviteMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => Promise.resolve(inviteId),
    onSuccess: (inviteId) => {
      queryClient.setQueryData<MembersPageData>(
        membersQueryKeys.roster(orgId),
        (prev) =>
          prev
            ? {
                ...prev,
                invites: prev.invites.filter(
                  (invite) => invite.id !== inviteId
                ),
              }
            : prev
      );
      invalidateOrgPeopleQueries(queryClient, orgId);
    },
  });
}

export function useResendInviteMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => Promise.resolve(inviteId),
    onSuccess: (inviteId) => {
      queryClient.setQueryData<MembersPageData>(
        membersQueryKeys.roster(orgId),
        (prev) => {
          if (!prev) return prev;
          const now = new Date();
          const expiresAt = new Date(now);
          expiresAt.setDate(expiresAt.getDate() + 7);

          return {
            ...prev,
            invites: prev.invites.map((invite) =>
              invite.id === inviteId
                ? {
                    ...invite,
                    sentAt: now,
                    expiresAt,
                    inviteToken: `tok_${crypto.randomUUID().slice(0, 8)}`,
                    status: "pending" as const,
                  }
                : invite
            ),
          };
        }
      );
    },
  });
}

export function useTransferOwnershipMutation(
  orgId: string,
  currentUserId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newOwnerId: string) => Promise.resolve(newOwnerId),
    onSuccess: (newOwnerId) => {
      queryClient.setQueryData<MembersPageData>(
        membersQueryKeys.roster(orgId),
        (prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.map((member) => {
                  if (member.id === newOwnerId) {
                    return { ...member, role: OrganizationRole.OWNER };
                  }
                  if (member.id === currentUserId) {
                    return { ...member, role: OrganizationRole.ADMIN };
                  }
                  return member;
                }),
              }
            : prev
      );
      invalidateOrgPeopleQueries(queryClient, orgId);
    },
  });
}

export { MemberNotFoundError };
