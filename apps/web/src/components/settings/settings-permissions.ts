import { OrganizationRole } from "@rivet/shared";

/** Owner and admin can view and edit organization identity settings. */
export function canViewOrgSettings(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;
}

export function canManageOrgSettings(role: OrganizationRole): boolean {
  return canViewOrgSettings(role);
}

/** Alias for org identity editing (name, slug, logo). */
export function canEditOrgIdentity(role: OrganizationRole): boolean {
  return canManageOrgSettings(role);
}

/** Only the org owner can permanently delete the organization. */
export function canDeleteOrg(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER;
}
