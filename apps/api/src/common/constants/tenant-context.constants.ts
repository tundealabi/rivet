import type { OrganizationRole } from "@/generated/prisma/client";

export const TENANT_CONTEXT_KEYS = {
  orgId: "orgId",
  orgRole: "orgRole",
  userId: "userId",
} as const;

export type TenantContextStore = {
  [TENANT_CONTEXT_KEYS.orgId]: string;
  [TENANT_CONTEXT_KEYS.orgRole]: OrganizationRole;
  [TENANT_CONTEXT_KEYS.userId]: string;
};
