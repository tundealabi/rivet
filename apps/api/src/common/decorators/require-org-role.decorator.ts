import { SetMetadata } from "@nestjs/common";
import { OrganizationRole } from "@rivet/shared/enums";

export const REQUIRE_ORG_ROLE_KEY = "requireOrgRole";

/** Minimum org role for the route. Missing decorator means any org member. */
export const RequireOrgRole = (minRole: OrganizationRole) =>
  SetMetadata(REQUIRE_ORG_ROLE_KEY, minRole);
