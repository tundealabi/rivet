import {
  decodePaginationCursor,
  encodePaginationCursor,
  toCursorPaginatedResult,
  toOffsetPaginatedResult,
} from "./pagination";
import { parseIdempotencyKey } from "./parse-idempotency-key";
import { parseOrgIdHeader } from "./parse-org-id-header";

export const Helpers = {
  decodePaginationCursor,
  encodePaginationCursor,
  parseIdempotencyKey,
  parseOrgIdHeader,
  toCursorPaginatedResult,
  toOffsetPaginatedResult,
};
