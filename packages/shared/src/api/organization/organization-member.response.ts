import { z } from "zod";

import { OrganizationRole } from "../../enums/org.enum.js";
import { CursorPaginationQuerySchema } from "../pagination.wire.js";

export const ListOrganizationMembersQuerySchema =
  CursorPaginationQuerySchema.extend({
    q: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe("Search by first name, last name, or email"),
  });

export type ListOrganizationMembersQueryWire = z.infer<
  typeof ListOrganizationMembersQuerySchema
>;

export const OrganizationMemberResponseSchema = z.object({
  email: z.string().email().describe("Member email"),
  firstName: z.string().describe("Member first name"),
  id: z.string().uuid().describe("User ID"),
  lastName: z.string().describe("Member last name"),
  role: z.nativeEnum(OrganizationRole).describe("Role in the organization"),
});

export type OrganizationMemberResponseWire = z.infer<
  typeof OrganizationMemberResponseSchema
>;
