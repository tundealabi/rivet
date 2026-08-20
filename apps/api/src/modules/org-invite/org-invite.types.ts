import { OrganizationRole } from "@generated/prisma";

import { Prisma } from "@/generated/prisma/client";

import {
  organizationInviteInviterInclude,
  organizationInviteOrganizationInclude,
} from "./org-invite.constants";

export interface CreateOrgInviteInput {
  email: string;
  expiresAt: Date;
  invitedById: string;
  lastSentAt: Date;
  orgId: string;
  role: OrganizationRole;
  tokenHash: string;
}

export interface FindOrgInviteByIdInput {
  id: string;
}

export interface FindOrgInviteByOrgAndIdInput {
  id: string;
  orgId: string;
}

export interface FindOrgInviteByTokenHashInput {
  tokenHash: string;
}

export interface FindActiveOrgInviteByOrgAndEmailInput {
  email: string;
  orgId: string;
}

export interface FindActiveOrgInvitesByOrgAndEmailsInput {
  emails: string[];
  orgId: string;
}

export interface CountActiveOrgInvitesInput {
  orgId: string;
}

export interface OrgInvitesListCursor {
  createdAt: Date;
  id: string;
}

export interface ListOrgInvitesInOrgInput {
  after?: OrgInvitesListCursor;
  limit: number;
  orgId: string;
}

export interface ListPendingOrgInvitesForEmailInput {
  after?: OrgInvitesListCursor;
  email: string;
  limit: number;
}

export type OrganizationInviteWithInviter =
  Prisma.OrganizationInviteGetPayload<{
    include: typeof organizationInviteInviterInclude;
  }>;

export type OrganizationInviteWithOrganization =
  Prisma.OrganizationInviteGetPayload<{
    include: typeof organizationInviteOrganizationInclude;
  }>;

export interface ListOrgInvitesInOrgResult {
  items: OrganizationInviteWithInviter[];
  next?: OrgInvitesListCursor;
}

export interface ListPendingOrgInvitesForEmailResult {
  items: OrganizationInviteWithOrganization[];
  next?: OrgInvitesListCursor;
}

export interface ConsumeOrgInviteInput {
  acceptedAt: Date;
  id: string;
}

export interface DeclineOrgInviteInput {
  declinedAt: Date;
  id: string;
}

export interface RevokeOrgInviteInput {
  id: string;
  orgId: string;
  revokedAt: Date;
}

export interface RotateOrgInviteTokenInput {
  expiresAt: Date;
  id: string;
  lastSentAt: Date;
  orgId: string;
  tokenHash: string;
}
