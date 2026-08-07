import { z } from "zod";

import { OrganizationRole } from "../../enums/org.enum.js";

export const UserOrganizationResponseSchema = z.object({
  memberCount: z
    .number()
    .int()
    .min(0)
    .describe("Total number of members in the organization"),
  orgId: z.string().uuid().describe("Organization ID"),
  orgName: z.string().describe("Organization name"),
  role: z
    .nativeEnum(OrganizationRole)
    .describe("User role in the organization"),
});

export type UserOrganizationResponseWire = z.infer<
  typeof UserOrganizationResponseSchema
>;
