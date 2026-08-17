import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  ErrorCode,
  ErrorMessage,
  hasMinOrgRole,
  OrganizationRole,
} from "@rivet/shared/enums";

import { REQUIRE_ORG_ROLE_KEY } from "@/common/decorators";
import { DomainError } from "@/common/errors";
import { TenantContextService } from "@/common/services";

@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const minRole = this.reflector.getAllAndOverride<OrganizationRole>(
      REQUIRE_ORG_ROLE_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!minRole) {
      return true;
    }

    if (
      !hasMinOrgRole(this.tenantContext.orgRole as OrganizationRole, minRole)
    ) {
      throw new DomainError(
        "FORBIDDEN",
        ErrorCode.FORBIDDEN,
        ErrorMessage.FORBIDDEN
      );
    }

    return true;
  }
}
