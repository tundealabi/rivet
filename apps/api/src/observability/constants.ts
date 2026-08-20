export const OTEL_SERVICE_NAME = "rivet-api";

export const SPAN_NAME = {
  exportProcess: "export.process",
} as const;

export const SPAN_ATTR = {
  exportJobId: "export.job_id",
  organizationId: "organization.id",
  requestId: "requestId",
} as const;

export const TRACE_EXPORTER = {
  console: "console",
  none: "none",
  otlp: "otlp",
} as const;

export type TraceExporterName =
  (typeof TRACE_EXPORTER)[keyof typeof TRACE_EXPORTER];

export const TRACE_SAMPLER = {
  alwaysOff: "always_off",
  alwaysOn: "always_on",
  parentBasedAlwaysOff: "parentbased_always_off",
  parentBasedAlwaysOn: "parentbased_always_on",
  parentBasedTraceIdRatio: "parentbased_traceidratio",
  traceIdRatio: "traceidratio",
} as const;

export type TraceSamplerName =
  (typeof TRACE_SAMPLER)[keyof typeof TRACE_SAMPLER];

export const REMOTE_WRITE_INTERVAL_MS = 15_000;
