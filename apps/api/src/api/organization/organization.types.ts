import type { CursorPaginationInput } from "@rivet/shared/api";
import type { AssignableInviteRole } from "@rivet/shared/enums";

export interface ListOrganizationMembersInput {
  pagination: CursorPaginationInput;
  q?: string;
}

export interface CreateOrganizationInput {
  name: string;
  userId: string;
}

export interface CreateOrganizationInvitesInput {
  emails: string[];
  role: AssignableInviteRole;
}

export interface ListOrganizationInvitesInput {
  pagination: CursorPaginationInput;
}

export interface ResendOrganizationInviteInput {
  id: string;
}

export interface RevokeOrganizationInviteInput {
  id: string;
}

export interface ListUserInvitationsInput {
  pagination: CursorPaginationInput;
  userId: string;
}

export interface PreviewInvitationInput {
  token: string;
}

export type AcceptInvitationInput = {
  userId: string;
} & ({ id: string } | { token: string });

export interface DeclineInvitationInput {
  id: string;
  userId: string;
}
