import { OrganizationRole } from "@rivet/shared";

export type PlanTier = "FREE" | "PRO" | "TEAM";
export type MemberStatus = "active" | "pending";
export type InviteStatus = "pending" | "expired";

export interface OrgMember {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  initials: string;
  role: OrganizationRole;
  joinedAt: Date;
  lastActiveAt: Date | null;
  status: MemberStatus;
}

export interface InvitedBy {
  id: string;
  name: string;
  initials: string;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: OrganizationRole;
  invitedBy: InvitedBy;
  sentAt: Date;
  expiresAt: Date;
  inviteToken: string;
  status: InviteStatus;
}

export const PLAN_SEAT_LIMITS: Record<PlanTier, number> = {
  FREE: 5,
  PRO: 25,
  TEAM: 100,
};

export const PLAN_LABELS: Record<PlanTier, string> = {
  FREE: "Free plan",
  PRO: "Pro plan",
  TEAM: "Team plan",
};

export function seatsRemainingLabel(used: number, limit: number): string {
  if (used > limit) {
    return `${used - limit} over limit`;
  }
  return `${limit - used} remaining`;
}

export function seatProgressPercent(used: number, limit: number): number {
  if (limit <= 0) return 100;
  return Math.min(100, (used / limit) * 100);
}

export const ROLE_LABELS: Record<OrganizationRole, string> = {
  [OrganizationRole.OWNER]: "Owner",
  [OrganizationRole.ADMIN]: "Admin",
  [OrganizationRole.MEMBER]: "Member",
  [OrganizationRole.VIEWER]: "Viewer",
};

/** Colored dots for role dropdown pills. */
export const ROLE_DOT_COLORS: Record<OrganizationRole, string> = {
  [OrganizationRole.OWNER]: "#4F46E5",
  [OrganizationRole.ADMIN]: "#7C3AED",
  [OrganizationRole.MEMBER]: "#71717A",
  [OrganizationRole.VIEWER]: "#D4D4D8",
};

export const ROLE_BADGE_STYLE: Record<
  OrganizationRole,
  { bg: string; color: string }
> = {
  [OrganizationRole.OWNER]: { bg: "#EEF2FF", color: "#4F46E5" },
  [OrganizationRole.ADMIN]: { bg: "#EDE9FE", color: "#7C3AED" },
  [OrganizationRole.MEMBER]: { bg: "#F4F4F5", color: "#52525B" },
  [OrganizationRole.VIEWER]: { bg: "#FAFAFA", color: "#A1A1AA" },
};

export function memberDisplayName(
  member: Pick<OrgMember, "firstName" | "lastName">
): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

export function countSeatsUsed(
  members: OrgMember[],
  invites: PendingInvite[]
): number {
  return (
    members.filter((m) => m.status === "active").length +
    invites.filter((i) => i.status === "pending" || i.status === "expired")
      .length
  );
}

export function seatUsageRatio(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return used / limit;
}

export function inviteLink(token: string): string {
  return `https://app.rivet.io/invite/${token}`;
}
