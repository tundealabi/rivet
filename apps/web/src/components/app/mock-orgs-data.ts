import { OrganizationRole } from "@rivet/shared";

import {
  MOCK_ORG_ID,
  MOCK_ORG_NAME,
  MOCK_ROLE,
} from "../members/mock-members-data";
import type { UserOrganization } from "./org-switcher-types";

function orgInitials(name: string): string {
  const words = name
    .replace(/[^\w\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function org(
  orgId: string,
  orgName: string,
  role: OrganizationRole,
  lastActiveAt: Date,
  logoUrl?: string
): UserOrganization {
  return {
    orgId,
    orgName,
    role,
    logoUrl,
    initials: orgInitials(orgName),
    lastActiveAt,
  };
}

/** Ada's org memberships — swap active org via the sidebar switcher. */
export const MOCK_USER_ORGANIZATIONS: UserOrganization[] = [
  org(MOCK_ORG_ID, MOCK_ORG_NAME, MOCK_ROLE, new Date("2026-07-23T08:30:00")),
  org(
    "org_globex",
    "Globex Ltd.",
    OrganizationRole.ADMIN,
    new Date("2026-07-22T14:15:00")
  ),
  org(
    "org_greenhouse",
    "Greenhouse Co.",
    OrganizationRole.ADMIN,
    new Date("2026-07-20T11:00:00")
  ),
  org(
    "org_side",
    "Side Collab",
    OrganizationRole.MEMBER,
    new Date("2026-07-18T09:00:00")
  ),
];

export function findOrganization(orgId: string): UserOrganization | undefined {
  return MOCK_USER_ORGANIZATIONS.find((item) => item.orgId === orgId);
}

/** Touch recency when switching orgs (v1 mock — replace with server data). */
export function touchOrganizationActivity(
  orgId: string,
  at = new Date()
): void {
  const organization = MOCK_USER_ORGANIZATIONS.find(
    (item) => item.orgId === orgId
  );
  if (organization) organization.lastActiveAt = at;
}
