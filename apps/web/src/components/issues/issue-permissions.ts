import { OrganizationRole } from "@rivet/shared";

import type { Issue } from "./issue-types";

export function canCreateIssues(role: OrganizationRole): boolean {
  return role !== OrganizationRole.VIEWER;
}

/** Members may edit issues they reported or are assigned to; admins/owners edit any. */
export function canEditIssue(
  role: OrganizationRole,
  issue: Pick<Issue, "reporter" | "assignee">,
  currentUser: string
): boolean {
  if (role === OrganizationRole.VIEWER) return false;
  if (role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN) {
    return true;
  }
  return issue.reporter === currentUser || issue.assignee === currentUser;
}

export function canCommentOnIssue(role: OrganizationRole): boolean {
  return role !== OrganizationRole.VIEWER;
}

export function canDeleteIssue(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;
}

export function canEditComment(
  role: OrganizationRole,
  author: string,
  currentUser: string
): boolean {
  if (role === OrganizationRole.VIEWER) return false;
  if (role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN) {
    return true;
  }
  return author === currentUser;
}

export function canDeleteComment(
  role: OrganizationRole,
  author: string,
  currentUser: string
): boolean {
  return canEditComment(role, author, currentUser);
}

/** @deprecated Use canEditIssue for per-issue checks. */
export function canEditIssues(role: OrganizationRole): boolean {
  return role !== OrganizationRole.VIEWER;
}

/** @deprecated Use canDeleteIssue. */
export function canDeleteIssues(role: OrganizationRole): boolean {
  return canDeleteIssue(role);
}
