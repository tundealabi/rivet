import type {
  ApiPaginationWire,
  CursorPaginatedResult,
  CursorPaginationInput,
  OffsetPaginatedResult,
  OffsetPaginationInput,
} from "@rivet/shared/api";
import { z } from "zod";

import type { PaginatedResult } from "@/common/types";

function encodePaginationCursor(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function decodePaginationCursor<T>(cursor: string, schema: z.ZodType<T>): T {
  const decoded = JSON.parse(
    Buffer.from(cursor, "base64").toString("utf8")
  ) as unknown;

  return schema.parse(decoded);
}

function toCursorPaginatedResult<T>(
  result: CursorPaginatedResult<T>,
  pagination: CursorPaginationInput
): PaginatedResult<T> {
  const wire: ApiPaginationWire = {
    nextCursor: result.nextCursor,
    limit: pagination.limit,
  };

  return {
    items: result.items,
    pagination: wire,
  };
}

function toOffsetPaginatedResult<T>(
  result: OffsetPaginatedResult<T>,
  pagination: OffsetPaginationInput
): PaginatedResult<T> {
  const totalPages =
    result.totalCount === 0
      ? 0
      : Math.ceil(result.totalCount / pagination.limit);

  const wire: ApiPaginationWire = {
    limit: pagination.limit,
    page: pagination.page,
    totalCount: result.totalCount,
    totalPages,
  };

  return {
    items: result.items,
    pagination: wire,
  };
}

export {
  decodePaginationCursor,
  encodePaginationCursor,
  toCursorPaginatedResult,
  toOffsetPaginatedResult,
};
