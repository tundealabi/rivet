import { OrganizationRole } from "@rivet/shared";

import type { OrgMember, PendingInvite, PlanTier } from "./member-types";

function member(
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  role: OrganizationRole,
  joinedAt: string,
  lastActiveAt: string | null
): OrgMember {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  return {
    id,
    userId: `user-${id}`,
    email,
    firstName,
    lastName,
    initials,
    role,
    joinedAt: new Date(joinedAt),
    lastActiveAt: lastActiveAt ? new Date(lastActiveAt) : null,
    status: "active",
  };
}

export const MOCK_ORG_ID = "org_acme";
export const MOCK_ORG_NAME = "Acme Inc.";
export const MOCK_PLAN_TIER: PlanTier = "PRO";
export const MOCK_CURRENT_USER_ID = "1";
export const MOCK_ROLE = OrganizationRole.OWNER;

export const MOCK_MEMBERS: OrgMember[] = [
  member(
    "1",
    "Ada",
    "Lovelace",
    "ada@acme.io",
    OrganizationRole.OWNER,
    "2025-01-10",
    "2026-07-22T09:00:00"
  ),
  member(
    "2",
    "Alan",
    "Turing",
    "alan@acme.io",
    OrganizationRole.ADMIN,
    "2025-02-14",
    "2026-07-21T14:30:00"
  ),
  member(
    "3",
    "Grace",
    "Hopper",
    "grace@acme.io",
    OrganizationRole.ADMIN,
    "2025-03-02",
    "2026-07-20T11:00:00"
  ),
  member(
    "4",
    "Katherine",
    "Johnson",
    "katherine@acme.io",
    OrganizationRole.MEMBER,
    "2025-04-18",
    "2026-07-22T08:15:00"
  ),
  member(
    "5",
    "Tim",
    "Berners-Lee",
    "tim@acme.io",
    OrganizationRole.MEMBER,
    "2025-05-06",
    "2026-07-19T16:00:00"
  ),
  member(
    "6",
    "Margaret",
    "Hamilton",
    "margaret@acme.io",
    OrganizationRole.MEMBER,
    "2025-05-22",
    "2026-07-18T10:00:00"
  ),
  member(
    "7",
    "Dennis",
    "Ritchie",
    "dennis@acme.io",
    OrganizationRole.MEMBER,
    "2025-06-01",
    "2026-06-01T00:00:00"
  ),
  member(
    "8",
    "Barbara",
    "Liskov",
    "barbara@acme.io",
    OrganizationRole.MEMBER,
    "2025-06-15",
    "2026-07-15T09:30:00"
  ),
  member(
    "9",
    "Linus",
    "Torvalds",
    "linus@acme.io",
    OrganizationRole.MEMBER,
    "2025-06-28",
    null
  ),
];

const ada = { id: "1", name: "Ada Lovelace", initials: "AL" };
const alan = { id: "2", name: "Alan Turing", initials: "AT" };

export const MOCK_PENDING_INVITES: PendingInvite[] = [
  {
    id: "inv-1",
    email: "james@acme.io",
    role: OrganizationRole.MEMBER,
    invitedBy: ada,
    sentAt: new Date("2026-07-22T08:00:00"),
    expiresAt: new Date("2026-07-27T08:00:00"),
    inviteToken: "tok_james_gosling",
    status: "pending",
  },
  {
    id: "inv-2",
    email: "radia@acme.io",
    role: OrganizationRole.VIEWER,
    invitedBy: alan,
    sentAt: new Date("2026-07-21T15:00:00"),
    expiresAt: new Date("2026-07-23T06:00:00"),
    inviteToken: "tok_radia_perlman",
    status: "pending",
  },
  {
    id: "inv-3",
    email: "donald@acme.io",
    role: OrganizationRole.MEMBER,
    invitedBy: ada,
    sentAt: new Date("2026-07-20T10:00:00"),
    expiresAt: new Date("2026-07-22T00:00:00"),
    inviteToken: "tok_donald_knuth",
    status: "expired",
  },
];
