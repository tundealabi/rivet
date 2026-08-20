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

/** Wire status for org-roster invite list. Expiry is computed, not stored. */
export enum OrganizationInviteStatus {
  PENDING = "PENDING",
  EXPIRED = "EXPIRED",
}

export const ASSIGNABLE_INVITE_ROLES = [
  OrganizationRole.ADMIN,
  OrganizationRole.MEMBER,
  OrganizationRole.VIEWER,
] as const;

export type AssignableInviteRole = (typeof ASSIGNABLE_INVITE_ROLES)[number];
