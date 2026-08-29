import { OrganizationRole } from "@rivet/shared";

import { authFetch } from "../../auth-api";
import {
  findOrganization as findMockOrganization,
  MOCK_USER_ORGANIZATIONS,
} from "./mock-orgs-data";
import type {
  CreateOrganizationInput,
  PendingOrgInvitation,
  UserOrganization,
  UserOrganizationsPayload,
} from "./org-switcher-types";

const ORGANIZATIONS_URL =
  "https://rivet-n8w6.onrender.com/api/v1/organizations";

const LOAD_DELAY_MS = 420;
const MOCK_MODE_KEY = "rivet_org_list_mock";
const ACTION_DELAY_MS = 320;

export class OrgListFetchError extends Error {
  constructor(message = "Couldn't load organizations") {
    super(message);
    this.name = "OrgListFetchError";
  }
}

interface OrganizationDto {
  orgId: string;
  orgName: string;
  role: OrganizationRole;
  memberCount: number;
}

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string } | null;
}

/** Fetches the authenticated user's organizations from the API. */
export async function fetchUserOrganizations(): Promise<UserOrganizationsPayload> {
  const response = await authFetch(ORGANIZATIONS_URL, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  let payload: ApiEnvelope<OrganizationDto[]>;

  try {
    payload = (await response.json()) as ApiEnvelope<OrganizationDto[]>;
  } catch {
    throw new OrgListFetchError(
      response.ok
        ? "The server returned an invalid response"
        : "Couldn't load organizations"
    );
  }

  if (!response.ok || payload.error) {
    throw new OrgListFetchError(
      payload.error?.message ?? "Couldn't load organizations"
    );
  }

  if (!payload.data) {
    throw new OrgListFetchError("The server returned an invalid response");
  }

  const organizations: UserOrganization[] = payload.data.map((org) => ({
    orgId: org.orgId,
    orgName: org.orgName,
    role: org.role,
    initials: orgInitials(org.orgName),
  }));

  return { organizations, pendingInvitations: [] };
}

const SEED_PENDING_INVITATIONS: PendingOrgInvitation[] = [
  {
    invitationId: "inv_northwind",
    orgName: "Northwind Traders",
    initials: "NT",
    role: OrganizationRole.MEMBER,
    invitedByName: "Alice Chen",
  },
  {
    invitationId: "inv_contoso",
    orgName: "Contoso Research",
    initials: "CR",
    role: OrganizationRole.VIEWER,
    invitedByName: "Bob Martinez",
  },
];

let pendingInvitationsStore: PendingOrgInvitation[] =
  SEED_PENDING_INVITATIONS.map((invite) => ({ ...invite }));

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

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function readMockMode(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(MOCK_MODE_KEY);
}

function snapshotPendingInvitations(): PendingOrgInvitation[] {
  return pendingInvitationsStore.map((invite) => ({ ...invite }));
}

/** Dev-only: sessionStorage `rivet_org_list_mock` = empty | error | single | loading */
export async function fetchUserOrganizationsMock(): Promise<UserOrganizationsPayload> {
  const mode = readMockMode();

  if (mode === "loading") {
    await new Promise((resolve) => setTimeout(resolve, 60_000));
  }

  await new Promise((resolve) => setTimeout(resolve, LOAD_DELAY_MS));

  if (mode === "error") {
    throw new OrgListFetchError();
  }

  if (mode === "empty") {
    return { organizations: [], pendingInvitations: [] };
  }

  if (mode === "single") {
    const [onlyOrg] = MOCK_USER_ORGANIZATIONS;
    if (!onlyOrg) {
      return { organizations: [], pendingInvitations: [] };
    }

    return {
      organizations: [onlyOrg],
      pendingInvitations: snapshotPendingInvitations(),
    };
  }

  return {
    organizations: [...MOCK_USER_ORGANIZATIONS],
    pendingInvitations: snapshotPendingInvitations(),
  };
}

export function findOrganizationInList(
  organizations: UserOrganizationsPayload["organizations"],
  orgId: string
): UserOrganizationsPayload["organizations"][number] | undefined {
  return organizations.find((item) => item.orgId === orgId);
}

/** Resolves org metadata from a fetched list, falling back to static mocks in dev. */
export function resolveOrganization(
  organizations: UserOrganizationsPayload["organizations"],
  orgId: string
) {
  return (
    findOrganizationInList(organizations, orgId) ?? findMockOrganization(orgId)
  );
}

export async function createOrganizationMock(
  input: CreateOrganizationInput
): Promise<{ orgId: string }> {
  await new Promise((resolve) => setTimeout(resolve, ACTION_DELAY_MS));

  const orgId = `org_${slugify(input.slug || input.name) || "new"}`;
  const orgName = input.name.trim();

  MOCK_USER_ORGANIZATIONS.push({
    orgId,
    orgName,
    role: OrganizationRole.OWNER,
    initials: orgInitials(orgName),
    logoUrl: input.logoUrl,
    lastActiveAt: new Date(),
  });

  return { orgId };
}

export async function acceptOrgInvitationMock(
  invitationId: string
): Promise<{ orgId: string; orgName: string }> {
  await new Promise((resolve) => setTimeout(resolve, ACTION_DELAY_MS));

  const invite = pendingInvitationsStore.find(
    (item) => item.invitationId === invitationId
  );
  if (!invite) {
    throw new Error("Invitation not found");
  }

  pendingInvitationsStore = pendingInvitationsStore.filter(
    (item) => item.invitationId !== invitationId
  );

  const orgId = `org_${slugify(invite.orgName)}`;
  const existing = MOCK_USER_ORGANIZATIONS.find((item) => item.orgId === orgId);

  if (!existing) {
    MOCK_USER_ORGANIZATIONS.push({
      orgId,
      orgName: invite.orgName,
      role: invite.role,
      initials: invite.initials,
      logoUrl: invite.logoUrl,
      lastActiveAt: new Date(),
    });
  }

  return { orgId, orgName: invite.orgName };
}

export async function declineOrgInvitationMock(
  invitationId: string
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ACTION_DELAY_MS));

  const exists = pendingInvitationsStore.some(
    (item) => item.invitationId === invitationId
  );
  if (!exists) {
    throw new Error("Invitation not found");
  }

  pendingInvitationsStore = pendingInvitationsStore.filter(
    (item) => item.invitationId !== invitationId
  );
}

export { slugify as slugifyOrganizationName };
