/**
 * Reference query DTO for cursor-paginated list endpoints.
 * Not wired to a route — see cursor-keyset-pagination.reference.ts.
 */

import { CursorPaginationQuerySchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class ListUserOrganizationsQueryDto extends createZodDto(
  CursorPaginationQuerySchema
) {}
