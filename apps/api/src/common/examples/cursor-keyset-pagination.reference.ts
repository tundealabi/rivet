/**
 * Reference implementation for cursor (keyset) pagination.
 *
 * Not imported by the application — copy and adapt when adding a paginated list
 * endpoint. See docs/ARCHITECTURE.md § Pagination and Helpers in
 * common/helpers/index.ts.
 *
 * Cursor fields must match orderBy exactly. This example uses membership
 * createdAt + id (stable, same-table sort).
 */

import type { CursorPaginationInput } from "@rivet/shared/api";
import { CURSOR_PAGINATION_MAX_LIMIT } from "@rivet/shared/constants";
import { z, ZodError } from "zod";

import { ValidationError } from "@/common/errors";
import { Helpers } from "@/common/helpers";
import type { PaginatedResult } from "@/common/types";

// --- Wire query DTO (api/<feature>/dto/) ------------------------------------
//
// import { CursorPaginationQuerySchema } from "@rivet/shared/api";
// import { createZodDto } from "nestjs-zod";
//
// export class ListItemsQueryDto extends createZodDto(CursorPaginationQuerySchema) {}

// --- Decoded cursor (module + api layers) -------------------------------------

export const ExampleListCursorSchema = z.object({
  createdAt: z.string().datetime(),
  membershipId: z.string().uuid(),
});

export type ExampleListCursor = z.infer<typeof ExampleListCursorSchema>;

export interface ExampleListModuleInput {
  after?: ExampleListCursor;
  limit: number;
  userId: string;
}

export interface ExampleListModuleResult<T> {
  items: T[];
  next?: ExampleListCursor;
}

// --- Module service: keyset query -------------------------------------------
//
// Repository findMany pattern — take limit + 1 to detect hasMore, slice, build next.

export interface ExampleMembershipRow {
  id: string;
  createdAt: Date;
  organizationId: string;
  organization: { name: string };
  role: string;
}

export function exampleListWithCursorPagination(
  memberships: ExampleMembershipRow[],
  input: ExampleListModuleInput
): ExampleListModuleResult<{ orgId: string; orgName: string; role: string }> {
  const { after, limit } = input;

  // In production, push filtering into Prisma instead of in-memory filtering:
  //
  // orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  // take: limit + 1,
  // where: {
  //   userId,
  //   ...(after
  //     ? {
  //         OR: [
  //           { createdAt: { gt: new Date(after.createdAt) } },
  //           {
  //             AND: [
  //               { createdAt: new Date(after.createdAt) },
  //               { id: { gt: after.membershipId } },
  //             ],
  //           },
  //         ],
  //       }
  //     : {}),
  // },

  let filtered = memberships;
  if (after) {
    const afterDate = new Date(after.createdAt);
    filtered = memberships.filter(
      (m) =>
        m.createdAt > afterDate ||
        (m.createdAt.getTime() === afterDate.getTime() &&
          m.id > after.membershipId)
    );
  }

  filtered.sort((a, b) => {
    const byDate = a.createdAt.getTime() - b.createdAt.getTime();
    if (byDate !== 0) return byDate;
    return a.id.localeCompare(b.id);
  });

  const page = filtered.slice(0, limit + 1);
  const hasMore = page.length > limit;
  const items = hasMore ? page.slice(0, limit) : page;
  const lastItem = items.at(-1);

  return {
    items: items.map((m) => ({
      orgId: m.organizationId,
      orgName: m.organization.name,
      role: m.role,
    })),
    next:
      hasMore && lastItem
        ? {
            createdAt: lastItem.createdAt.toISOString(),
            membershipId: lastItem.id,
          }
        : undefined,
  };
}

// --- API service: decode cursor, call module, encode nextCursor ---------------

export interface ExampleGetListInput {
  pagination: CursorPaginationInput;
  userId: string;
}

export function exampleDecodeCursor(
  cursor: string | undefined
): ExampleListCursor | undefined {
  if (!cursor) {
    return undefined;
  }

  try {
    return Helpers.decodePaginationCursor(cursor, ExampleListCursorSchema);
  } catch (err) {
    if (err instanceof ZodError || err instanceof SyntaxError) {
      throw new ValidationError({
        cursor: [{ message: "Invalid cursor" }],
      });
    }
    throw err;
  }
}

export function exampleToPaginatedApiResult<T>(
  result: ExampleListModuleResult<T>,
  pagination: CursorPaginationInput
): PaginatedResult<T> {
  return Helpers.toCursorPaginatedResult(
    {
      items: result.items,
      nextCursor: result.next
        ? Helpers.encodePaginationCursor(result.next)
        : null,
    },
    pagination
  );
}

/** Safety cap when an endpoint might later drop pagination but still needs a bound. */
export const EXAMPLE_LIST_MAX_ITEMS = CURSOR_PAGINATION_MAX_LIMIT;
