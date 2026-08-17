import {
  decodePaginationCursor,
  encodePaginationCursor,
  toCursorPaginatedResult,
  toOffsetPaginatedResult,
} from "./pagination";
import { parseIdempotencyKey } from "./parse-idempotency-key";
import { parseOrgIdHeader } from "./parse-org-id-header";
import { redactSensitiveFields, redactSensitiveUrl } from "./redact-request";

export const Helpers = {
  decodePaginationCursor,
  encodePaginationCursor,
  parseIdempotencyKey,
  parseOrgIdHeader,
  redactSensitiveFields,
  redactSensitiveUrl,
  toCursorPaginatedResult,
  toOffsetPaginatedResult,
};
