import { z } from "zod";

import { CursorPaginationQuerySchema } from "../pagination.wire.js";

export const ListIssueActivityQuerySchema = CursorPaginationQuerySchema;

export type ListIssueActivityQueryWire = z.infer<
  typeof ListIssueActivityQuerySchema
>;
