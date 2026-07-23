import { OrganizationRole } from "@rivet/shared";

import { formatDateLong } from "../issues/issue-types";
import type { OrgMember } from "./member-types";
import { memberDisplayName } from "./member-types";

export type MemberRoleFilter = "all" | OrganizationRole;
export type MemberSortField = "name" | "joined" | "lastActive";
export type SortDirection = "asc" | "desc";

export function formatJoinedLabel(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);

  if (diffDays < 1) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  }
  return formatDateLong(date);
}

export function formatLastActiveLabel(date: Date | null): string {
  if (!date) return "Never";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Active today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

export function formatSentLabel(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDateLong(date);
}

export type ExpiresTone = "default" | "warning" | "danger";

export function formatExpiresLabel(expiresAt: Date): {
  label: string;
  tone: ExpiresTone;
} {
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { label: "Expired", tone: "danger" };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 24) {
    return {
      label: diffHours <= 1 ? "in 1 hour" : `in ${diffHours} hours`,
      tone: "warning",
    };
  }
  if (diffDays === 1) return { label: "in 1 day", tone: "default" };
  return { label: `in ${diffDays} days`, tone: "default" };
}

export function filterMembers(
  members: OrgMember[],
  search: string,
  roleFilter: MemberRoleFilter
): OrgMember[] {
  const query = search.trim().toLowerCase();

  return members.filter((member) => {
    if (roleFilter !== "all" && member.role !== roleFilter) return false;
    if (!query) return true;

    const name = memberDisplayName(member).toLowerCase();
    return name.includes(query) || member.email.toLowerCase().includes(query);
  });
}

export function sortMembers(
  members: OrgMember[],
  field: MemberSortField,
  direction: SortDirection
): OrgMember[] {
  const sorted = [...members].sort((a, b) => {
    switch (field) {
      case "name": {
        const nameA = memberDisplayName(a).toLowerCase();
        const nameB = memberDisplayName(b).toLowerCase();
        return nameA.localeCompare(nameB);
      }
      case "joined":
        return a.joinedAt.getTime() - b.joinedAt.getTime();
      case "lastActive": {
        const aTime = a.lastActiveAt?.getTime() ?? 0;
        const bTime = b.lastActiveAt?.getTime() ?? 0;
        return aTime - bTime;
      }
      default:
        return 0;
    }
  });

  return direction === "asc" ? sorted : sorted.reverse();
}

export function countAssignedIssues(memberId: string): number {
  return Math.floor(Math.abs(memberId.charCodeAt(0) * 3) % 9);
}

export function countReporterIssues(memberId: string): number {
  const base = memberId
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Math.floor((base * 7) % 15);
}
