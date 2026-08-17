import { z } from "zod";

export const OrgMembersListCursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().uuid(),
});

export const OrgInvitesListCursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().uuid(),
});
