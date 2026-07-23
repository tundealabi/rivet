import { OrganizationRole } from "@rivet/shared";

export function canManageProject(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;
}

export function canCreateProjectIssues(role: OrganizationRole): boolean {
  return role !== OrganizationRole.VIEWER;
}

export function canDeleteProject(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER;
}
