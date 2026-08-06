import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";
import type { Request } from "express";
import { ClsService } from "nestjs-cls";

import {
  TENANT_CONTEXT_KEYS,
  type TenantContextStore,
} from "@/common/constants/tenant-context.constants";
import { DomainError } from "@/common/errors";
import { Helpers } from "@/common/helpers";
import { AuthJwtUser } from "@/modules/auth/auth.entities";
import { OrgMemberService } from "@/modules/org-member/org-member.service";

type AuthenticatedRequest = Request & {
  user: AuthJwtUser;
};

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(
    private readonly cls: ClsService<TenantContextStore>,
    private readonly orgMemberService: OrgMemberService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const orgId = Helpers.parseOrgIdHeader(request);
    const userId = request.user.sub;

    const orgMember = await this.orgMemberService.findByOrgAndUser({
      orgId,
      userId,
    });

    if (!orgMember) {
      throw new DomainError(
        "FORBIDDEN",
        ErrorCode.FORBIDDEN,
        ErrorMessage.FORBIDDEN
      );
    }

    this.cls.set(TENANT_CONTEXT_KEYS.orgId, orgId);
    this.cls.set(TENANT_CONTEXT_KEYS.userId, userId);
    this.cls.set(TENANT_CONTEXT_KEYS.orgRole, orgMember.role);

    return true;
  }
}
