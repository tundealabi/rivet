import type { OrganizationRole } from "@rivet/shared";

import type { OrgMember, PendingInvite } from "./member-types";

const LOAD_DELAY_MS = 700;
const INVITE_SEND_DELAY_MS = 1200;
const ROLE_UPDATE_DELAY_MS = 500;

export class MemberNotFoundError extends Error {
  constructor() {
    super("Member not found");
    this.name = "MemberNotFoundError";
  }
}

export interface MembersPageData {
  members: OrgMember[];
  invites: PendingInvite[];
}

/** Simulates fetching org roster for the active tenant. Replace with TanStack Query + API. */
export async function fetchMembersMock(
  orgId: string,
  members: OrgMember[],
  invites: PendingInvite[],
  options?: { fail?: boolean }
): Promise<MembersPageData> {
  void orgId;
  await new Promise((resolve) => setTimeout(resolve, LOAD_DELAY_MS));
  if (options?.fail) {
    throw new Error("Failed to load members");
  }
  return { members, invites };
}

/** Simulates sending invites. Dialog stays open until this resolves. */
export async function sendInvitesMock(
  invites: PendingInvite[],
  options?: { fail?: boolean }
): Promise<PendingInvite[]> {
  await new Promise((resolve) => setTimeout(resolve, INVITE_SEND_DELAY_MS));
  if (options?.fail) {
    throw new Error("Failed to send invites");
  }
  return invites;
}

/** Simulates updating a member role. */
export async function updateMemberRoleMock(
  memberId: string,
  _role: OrganizationRole,
  options?: { fail?: boolean; notFound?: boolean }
): Promise<void> {
  void memberId;
  await new Promise((resolve) => setTimeout(resolve, ROLE_UPDATE_DELAY_MS));
  if (options?.notFound) {
    throw new MemberNotFoundError();
  }
  if (options?.fail) {
    throw new Error("Failed to update role");
  }
}

export { INVITE_SEND_DELAY_MS, LOAD_DELAY_MS, ROLE_UPDATE_DELAY_MS };
