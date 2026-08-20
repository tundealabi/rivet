import type { ClsService } from "nestjs-cls";

import {
  TENANT_CONTEXT_KEYS,
  type TenantContextStore,
} from "@/common/constants";

export type TenantLogFields = {
  orgId?: string;
  userId?: string;
};

export function tenantFieldsFromCls(
  cls: ClsService<TenantContextStore>
): TenantLogFields {
  if (!cls.isActive()) {
    return {};
  }

  const orgId = cls.get(TENANT_CONTEXT_KEYS.orgId);
  const userId = cls.get(TENANT_CONTEXT_KEYS.userId);

  return {
    ...(typeof orgId === "string" && orgId.length > 0 ? { orgId } : {}),
    ...(typeof userId === "string" && userId.length > 0 ? { userId } : {}),
  };
}

export function resolveTenantLogFields(
  cls: ClsService<TenantContextStore>,
  request: { logFields?: TenantLogFields }
): TenantLogFields {
  return {
    ...request.logFields,
    ...tenantFieldsFromCls(cls),
  };
}
