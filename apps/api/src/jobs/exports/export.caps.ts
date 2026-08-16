import {
  EXPORT_ERROR_DURATION_LIMIT,
  EXPORT_ERROR_ROW_LIMIT,
  EXPORT_WORKER_MAX_DURATION_MS,
  EXPORT_WORKER_MAX_ROWS,
} from "./export.constants";

export class ExportCapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportCapError";
  }
}

export function assertExportWithinCaps(input: {
  nowMs?: number;
  rowCount: number;
  startedAtMs: number;
}): void {
  if (input.rowCount > EXPORT_WORKER_MAX_ROWS) {
    throw new ExportCapError(EXPORT_ERROR_ROW_LIMIT);
  }

  const nowMs = input.nowMs ?? Date.now();
  if (nowMs - input.startedAtMs > EXPORT_WORKER_MAX_DURATION_MS) {
    throw new ExportCapError(EXPORT_ERROR_DURATION_LIMIT);
  }
}
