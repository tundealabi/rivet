import type { OrganizationRole } from "@rivet/shared";

export interface UserOrganization {
  orgId: string;
  orgName: string;
  role: OrganizationRole;
  logoUrl?: string;
  initials: string;
  /** Used to order non-active orgs by recency in the switcher menu. */
  lastActiveAt?: Date;
}

export interface PendingOrgInvitation {
  invitationId: string;
  orgName: string;
  initials: string;
  logoUrl?: string;
  role: OrganizationRole;
  invitedByName?: string;
}

export interface UserOrganizationsPayload {
  organizations: UserOrganization[];
  pendingInvitations: PendingOrgInvitation[];
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  logoUrl?: string;
}

export type UserOrganizationsStatus = "loading" | "error" | "success";
