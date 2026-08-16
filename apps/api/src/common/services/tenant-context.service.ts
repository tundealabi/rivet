import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ClsService } from "nestjs-cls";

import {
  TENANT_CONTEXT_KEYS,
  type TenantContextStore,
} from "@/common/constants";
import type { OrganizationRole } from "@/generated/prisma/client";

type TenantContextInput = {
  orgId: string;
  orgRole?: OrganizationRole;
  userId: string;
};

@Injectable()
export class TenantContextService {
  constructor(private readonly cls: ClsService<TenantContextStore>) {}

  /**
   * Isolated CLS for async entry points (BullMQ, webhooks).
   * Does not inherit an HTTP request store.
   */
  runWithTenantContext<T>(
    context: TenantContextInput,
    fn: () => T | Promise<T>
  ): Promise<T> {
    return this.cls.run(async () => {
      this.cls.set(TENANT_CONTEXT_KEYS.orgId, context.orgId);
      this.cls.set(TENANT_CONTEXT_KEYS.userId, context.userId);
      if (context.orgRole !== undefined) {
        this.cls.set(TENANT_CONTEXT_KEYS.orgRole, context.orgRole);
      }
      return fn();
    });
  }

  get orgId(): string {
    const orgId = this.cls.get(TENANT_CONTEXT_KEYS.orgId);

    if (!orgId) {
      throw new InternalServerErrorException("Tenant org context is missing");
    }

    return orgId;
  }

  get userId(): string {
    const userId = this.cls.get(TENANT_CONTEXT_KEYS.userId);

    if (!userId) {
      throw new InternalServerErrorException("Tenant user context is missing");
    }

    return userId;
  }

  get orgRole(): OrganizationRole {
    const orgRole = this.cls.get(TENANT_CONTEXT_KEYS.orgRole);

    if (!orgRole) {
      throw new InternalServerErrorException("Tenant role context is missing");
    }

    return orgRole;
  }
}
