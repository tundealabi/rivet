import { z } from "zod";

import { CursorPaginationQuerySchema } from "../pagination.wire.js";

export const ListOrganizationInvitesQuerySchema = CursorPaginationQuerySchema;

export type ListOrganizationInvitesQueryWire = z.infer<
  typeof ListOrganizationInvitesQuerySchema
>;
