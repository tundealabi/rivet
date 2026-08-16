import { assertExportWithinCaps, ExportCapError } from "./export.caps";
import {
  EXPORT_ERROR_DURATION_LIMIT,
  EXPORT_ERROR_ROW_LIMIT,
  EXPORT_WORKER_MAX_DURATION_MS,
  EXPORT_WORKER_MAX_ROWS,
} from "./export.constants";

describe("assertExportWithinCaps", () => {
  it("allows the maximum row count and duration", () => {
    expect(() =>
      assertExportWithinCaps({
        nowMs: EXPORT_WORKER_MAX_DURATION_MS,
        rowCount: EXPORT_WORKER_MAX_ROWS,
        startedAtMs: 0,
      })
    ).not.toThrow();
  });

  it("fails with a stable string when row count is exceeded", () => {
    expect(() =>
      assertExportWithinCaps({
        rowCount: EXPORT_WORKER_MAX_ROWS + 1,
        startedAtMs: Date.now(),
      })
    ).toThrow(new ExportCapError(EXPORT_ERROR_ROW_LIMIT));
  });

  it("fails with a stable string when duration is exceeded", () => {
    expect(() =>
      assertExportWithinCaps({
        nowMs: EXPORT_WORKER_MAX_DURATION_MS + 1,
        rowCount: 1,
        startedAtMs: 0,
      })
    ).toThrow(new ExportCapError(EXPORT_ERROR_DURATION_LIMIT));
  });
});
