import { OrganizationRole } from "@rivet/shared";

import type { OrgMember } from "./member-types";

export function canInviteMembers(role: OrganizationRole): boolean {
  return role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;
}

/** Admin/Owner roster management — invite, role changes, destructive actions. */
export function canManageMembers(role: OrganizationRole): boolean {
  return canInviteMembers(role);
}

export function canViewPendingInvites(role: OrganizationRole): boolean {
  return canManageMembers(role);
}

export function isCurrentUser(
  member: OrgMember,
  currentUserId: string
): boolean {
  return member.id === currentUserId || member.userId === currentUserId;
}

export function canChangeMemberRole(
  actorRole: OrganizationRole,
  target: OrgMember,
  currentUserId: string
): boolean {
  if (!canInviteMembers(actorRole)) return false;
  if (isCurrentUser(target, currentUserId)) return false;
  if (target.role === OrganizationRole.OWNER) return false;
  return true;
}

export function canRemoveMember(
  actorRole: OrganizationRole,
  target: OrgMember,
  currentUserId: string
): boolean {
  if (!canInviteMembers(actorRole)) return false;
  if (isCurrentUser(target, currentUserId)) return false;
  if (target.role === OrganizationRole.OWNER) return false;
  return true;
}

export function canTransferOwnership(actorRole: OrganizationRole): boolean {
  return actorRole === OrganizationRole.OWNER;
}

export function canShowTransferTo(
  actorRole: OrganizationRole,
  target: OrgMember,
  currentUserId: string
): boolean {
  return (
    canTransferOwnership(actorRole) &&
    !isCurrentUser(target, currentUserId) &&
    target.role === OrganizationRole.ADMIN
  );
}

/** Roles assignable via dropdown. Owner only via transfer flow. */
export function assignableRoles(
  actorRole: OrganizationRole
): OrganizationRole[] {
  const roles = [
    OrganizationRole.ADMIN,
    OrganizationRole.MEMBER,
    OrganizationRole.VIEWER,
  ];
  if (actorRole === OrganizationRole.OWNER) {
    return roles;
  }
  return roles;
}

export function canAssignOwner(actorRole: OrganizationRole): boolean {
  return actorRole === OrganizationRole.OWNER;
}

/** Admins and owners see row action menus; viewers/members see the roster quietly. */
export function canViewMemberActions(actorRole: OrganizationRole): boolean {
  return canManageMembers(actorRole);
}
