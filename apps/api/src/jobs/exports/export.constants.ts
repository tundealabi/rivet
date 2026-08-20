import { CURSOR_PAGINATION_MAX_LIMIT } from "@rivet/shared/constants";

export const EXPORT_WORKER_PAGE_SIZE = CURSOR_PAGINATION_MAX_LIMIT;
export const EXPORT_WORKER_MAX_ROWS = 50_000;
export const EXPORT_WORKER_MAX_DURATION_MS = 5 * 60 * 1000;
export const EXPORT_WORKER_LOCK_DURATION_MS = 6 * 60 * 1000;
export const EXPORT_OBJECT_TTL_MS = 24 * 60 * 60 * 1000;
export const EXPORT_JOB_ATTEMPTS = 3;
export const EXPORT_JOB_BACKOFF_MS = 5_000;

export const EXPORT_ERROR_ROW_LIMIT =
  "Export exceeded the maximum of 50000 rows";
export const EXPORT_ERROR_DURATION_LIMIT =
  "Export exceeded the maximum duration of 5 minutes";
