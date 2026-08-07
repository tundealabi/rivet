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
