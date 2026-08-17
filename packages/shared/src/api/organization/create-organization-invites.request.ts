import { z } from "zod";

import { INVITE_MAX_EMAILS_PER_REQUEST } from "../../constants.js";
import { ASSIGNABLE_INVITE_ROLES } from "../../enums/org.enum.js";

export const CreateOrganizationInvitesRequestSchema = z.object({
  emails: z
    .array(z.string().trim().toLowerCase().email())
    .min(1)
    .max(INVITE_MAX_EMAILS_PER_REQUEST)
    .transform((emails) => [...new Set(emails)])
    .describe("Invitee emails; duplicates are removed"),
  role: z
    .enum(ASSIGNABLE_INVITE_ROLES)
    .describe("Role granted on accept; cannot be OWNER"),
});

export type CreateOrganizationInvitesRequestWire = z.infer<
  typeof CreateOrganizationInvitesRequestSchema
>;
