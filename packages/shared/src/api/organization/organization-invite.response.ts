import { z } from "zod";

import {
  OrganizationInviteStatus,
  OrganizationRole,
} from "../../enums/org.enum.js";

export const OrganizationInviteInviterSchema = z.object({
  firstName: z.string().describe("Inviter first name"),
  id: z.string().uuid().describe("Inviter user ID"),
  lastName: z.string().describe("Inviter last name"),
});

export type OrganizationInviteInviterWire = z.infer<
  typeof OrganizationInviteInviterSchema
>;

export const OrganizationInviteResponseSchema = z.object({
  createdAt: z.string().datetime().describe("When the invite was created"),
  email: z.string().email().describe("Invitee email"),
  expiresAt: z.string().datetime().describe("When the invite expires"),
  id: z.string().uuid().describe("Invite ID"),
  invitedBy: OrganizationInviteInviterSchema.nullable().describe(
    "User who sent the invite; null if the inviter was removed"
  ),
  role: z
    .nativeEnum(OrganizationRole)
    .describe("Role granted when the invite is accepted"),
  sentAt: z.string().datetime().describe("When the invite was last sent"),
  status: z
    .nativeEnum(OrganizationInviteStatus)
    .describe("PENDING if unexpired; EXPIRED otherwise"),
});

export type OrganizationInviteResponseWire = z.infer<
  typeof OrganizationInviteResponseSchema
>;

export const OrganizationInviteCreatedResponseSchema =
  OrganizationInviteResponseSchema.extend({
    token: z
      .string()
      .describe("Opaque invite token; returned only on create and resend"),
  });

export type OrganizationInviteCreatedResponseWire = z.infer<
  typeof OrganizationInviteCreatedResponseSchema
>;

export const UserInvitationResponseSchema = z.object({
  expiresAt: z.string().datetime().describe("When the invite expires"),
  id: z.string().uuid().describe("Invite ID"),
  invitedByName: z
    .string()
    .nullable()
    .describe("Display name of the inviter, if known"),
  orgId: z.string().uuid().describe("Organization ID"),
  orgName: z.string().describe("Organization name"),
  role: z
    .nativeEnum(OrganizationRole)
    .describe("Role granted when the invite is accepted"),
});

export type UserInvitationResponseWire = z.infer<
  typeof UserInvitationResponseSchema
>;

export const InvitationPreviewResponseSchema = z.object({
  orgName: z.string().describe("Organization name"),
  role: z
    .nativeEnum(OrganizationRole)
    .describe("Role granted when the invite is accepted"),
});

export type InvitationPreviewResponseWire = z.infer<
  typeof InvitationPreviewResponseSchema
>;

export const AcceptInvitationResponseSchema = z.object({
  orgId: z.string().uuid().describe("Joined organization ID"),
  orgName: z.string().describe("Joined organization name"),
  role: z
    .nativeEnum(OrganizationRole)
    .describe("Role granted in the organization"),
});

export type AcceptInvitationResponseWire = z.infer<
  typeof AcceptInvitationResponseSchema
>;
