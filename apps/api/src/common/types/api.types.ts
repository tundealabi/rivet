import type { ApiPaginationWire } from "@rivet/shared/api";

export interface PaginatedResult<T> {
  items: T[];
  pagination: ApiPaginationWire;
}

export function isPaginatedResult(
  value: unknown
): value is PaginatedResult<unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as PaginatedResult<unknown>;
  return Array.isArray(candidate.items) && candidate.pagination !== undefined;
}
