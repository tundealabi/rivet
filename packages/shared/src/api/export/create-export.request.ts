import { z } from "zod";

import { IssueListFiltersSchema } from "../issue/list-issues.query.js";

export const CreateExportRequestSchema = IssueListFiltersSchema;

export type CreateExportRequestWire = z.infer<typeof CreateExportRequestSchema>;
