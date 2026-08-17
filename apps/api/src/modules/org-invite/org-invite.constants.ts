import { Prisma } from "@/generated/prisma/client";

export const organizationInviteListOrderBy = [
  { createdAt: "asc" },
  { id: "asc" },
] as const satisfies Prisma.OrganizationInviteOrderByWithRelationInput[];

export const organizationInviteInviterInclude = {
  invitedBy: {
    select: {
      firstName: true,
      id: true,
      lastName: true,
    },
  },
} satisfies Prisma.OrganizationInviteInclude;

export const organizationInviteOrganizationInclude = {
  invitedBy: {
    select: {
      firstName: true,
      id: true,
      lastName: true,
    },
  },
  organization: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.OrganizationInviteInclude;

export function organizationInviteActiveWhere(
  now: Date
): Prisma.OrganizationInviteWhereInput {
  return {
    acceptedAt: null,
    declinedAt: null,
    expiresAt: { gt: now },
    revokedAt: null,
  };
}

export function organizationInviteOpenWhere(): Prisma.OrganizationInviteWhereInput {
  return {
    acceptedAt: null,
    declinedAt: null,
    revokedAt: null,
  };
}
