import { OrganizationRole } from "@generated/prisma";
import { OrganizationRole as SharedOrganizationRole } from "@rivet/shared/enums";

export interface CreateOrgMemberInput {
  orgId: string;
  role: OrganizationRole;
  userId: string;
}

export interface FindByOrgAndUserInput {
  orgId: string;
  userId: string;
}

export interface FindByOrgAndEmailInput {
  email: string;
  orgId: string;
}

export interface FindByOrgAndEmailsInput {
  emails: string[];
  orgId: string;
}

export interface ListOrganizationsForUserInput {
  userId: string;
}

export interface ListOrganizationsForUserResult {
  items: UserOrganizationItem[];
}

export interface UserOrganizationItem {
  memberCount: number;
  orgId: string;
  orgName: string;
  role: SharedOrganizationRole;
}

export interface OrgMembersListCursor {
  createdAt: Date;
  id: string;
}

export interface ListMembersInOrgInput {
  after?: OrgMembersListCursor;
  limit: number;
  orgId: string;
  q?: string;
}

export interface OrganizationMemberItem {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  role: SharedOrganizationRole;
}

export interface ListMembersInOrgResult {
  items: OrganizationMemberItem[];
  next?: OrgMembersListCursor;
}
