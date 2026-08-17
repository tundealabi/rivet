import { z } from "zod";

import { CursorPaginationQuerySchema } from "../pagination.wire.js";

export const ListIssueCommentsQuerySchema = CursorPaginationQuerySchema;

export type ListIssueCommentsQueryWire = z.infer<
  typeof ListIssueCommentsQuerySchema
>;
