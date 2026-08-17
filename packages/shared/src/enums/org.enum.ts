export enum OrganizationRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  VIEWER = "VIEWER",
}

/** Total order for min-role checks. */
export const ORG_ROLE_RANK: Record<OrganizationRole, number> = {
  [OrganizationRole.VIEWER]: 0,
  [OrganizationRole.MEMBER]: 1,
  [OrganizationRole.ADMIN]: 2,
  [OrganizationRole.OWNER]: 3,
};

export function hasMinOrgRole(
  role: OrganizationRole,
  minRole: OrganizationRole
): boolean {
  return ORG_ROLE_RANK[role] >= ORG_ROLE_RANK[minRole];
}

export enum PlanTier {
  FREE = "FREE",
  PRO = "PRO",
  TEAM = "TEAM",
}
