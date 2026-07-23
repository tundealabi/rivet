import { OrganizationRole } from "@rivet/shared";

import { canViewPendingInvites } from "../members/member-permissions";

/** Owner/Admin see org-wide pulse; Member/Viewer tilt toward personal context. */
export function usesPersonalPulse(role: OrganizationRole): boolean {
  return role === OrganizationRole.MEMBER || role === OrganizationRole.VIEWER;
}

export function usesPersonalActivityFeed(role: OrganizationRole): boolean {
  return usesPersonalPulse(role);
}

export function canViewDashboardPendingInvites(
  role: OrganizationRole
): boolean {
  return canViewPendingInvites(role);
}

export function canViewUsageSnapshot(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER;
}

export function canCreateProjectFromDashboard(role: OrganizationRole): boolean {
  return role !== OrganizationRole.VIEWER;
}
