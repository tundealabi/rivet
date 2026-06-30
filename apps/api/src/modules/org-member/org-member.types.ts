import { OrganizationRole } from "@generated/prisma";

import { OperationContext } from "@/common/types";

export interface CreateOrgMemberInput {
  orgId: string;
  role: OrganizationRole;
  userId: string;
  ctx?: OperationContext;
}

export interface FindOrgMemberByUserIdAndOrgIdInput {
  orgId: string;
  userId: string;
  ctx?: OperationContext;
}
