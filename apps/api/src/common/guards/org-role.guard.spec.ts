import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  ErrorCode,
  hasMinOrgRole,
  OrganizationRole,
} from "@rivet/shared/enums";

import { DomainError } from "@/common/errors";
import { TenantContextService } from "@/common/services";

import { OrgRoleGuard } from "./org-role.guard";

describe("hasMinOrgRole", () => {
  it.each([
    [OrganizationRole.VIEWER, OrganizationRole.VIEWER, true],
    [OrganizationRole.MEMBER, OrganizationRole.MEMBER, true],
    [OrganizationRole.ADMIN, OrganizationRole.MEMBER, true],
    [OrganizationRole.OWNER, OrganizationRole.ADMIN, true],
    [OrganizationRole.VIEWER, OrganizationRole.MEMBER, false],
    [OrganizationRole.MEMBER, OrganizationRole.ADMIN, false],
    [OrganizationRole.ADMIN, OrganizationRole.OWNER, false],
  ] as const)("%s vs min %s → %s", (role, minRole, expected) => {
    expect(hasMinOrgRole(role, minRole)).toBe(expected);
  });
});

describe("OrgRoleGuard", () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const tenantContext = {
    orgRole: OrganizationRole.MEMBER,
  };

  const guard = new OrgRoleGuard(
    reflector as unknown as Reflector,
    tenantContext as unknown as TenantContextService
  );

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;

  beforeEach(() => {
    reflector.getAllAndOverride.mockReset();
    tenantContext.orgRole = OrganizationRole.MEMBER;
  });

  it("allows when no role is required", () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows when the caller meets the min role", () => {
    reflector.getAllAndOverride.mockReturnValue(OrganizationRole.MEMBER);
    tenantContext.orgRole = OrganizationRole.ADMIN;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejects when the caller is below the min role", () => {
    reflector.getAllAndOverride.mockReturnValue(OrganizationRole.ADMIN);

    expect(() => guard.canActivate(context)).toThrow(DomainError);

    try {
      guard.canActivate(context);
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe(ErrorCode.FORBIDDEN);
    }
  });
});
