import { httpRouteTemplate } from "./http-route-template";
import {
  decodePaginationCursor,
  encodePaginationCursor,
  toCursorPaginatedResult,
  toOffsetPaginatedResult,
} from "./pagination";
import { parseIdempotencyKey } from "./parse-idempotency-key";
import { parseOrgIdHeader } from "./parse-org-id-header";
import { createPinoHttpOptions } from "./pino-http";
import { redactSensitiveFields, redactSensitiveUrl } from "./redact-request";
import { buildRequestErrorLog } from "./request-error-log";
import {
  resolveTenantLogFields,
  tenantFieldsFromCls,
} from "./tenant-log-fields";

export const Helpers = {
  buildRequestErrorLog,
  createPinoHttpOptions,
  decodePaginationCursor,
  encodePaginationCursor,
  httpRouteTemplate,
  parseIdempotencyKey,
  parseOrgIdHeader,
  redactSensitiveFields,
  redactSensitiveUrl,
  resolveTenantLogFields,
  tenantFieldsFromCls,
  toCursorPaginatedResult,
  toOffsetPaginatedResult,
};
