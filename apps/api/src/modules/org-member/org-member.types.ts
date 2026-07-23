import { OrganizationRole } from "@generated/prisma";

export interface CreateOrgMemberInput {
  orgId: string;
  role: OrganizationRole;
  userId: string;
}

export interface FindByOrgAndUserInput {
  orgId: string;
  userId: string;
}
