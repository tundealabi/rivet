import { OrganizationRole } from "@generated/prisma";

export interface CreateOrgMemberInput {
  orgId: string;
  role: OrganizationRole;
  userId: string;
}

export interface FindOrgMemberByUserIdAndOrgIdInput {
  orgId: string;
  userId: string;
}
