export type ExportJobTraceContext = Record<string, string>;

export type ExportJobPayload = {
  exportJobId: string;
  organizationId: string;
  requestedById: string;
  requestId?: string;
  traceContext?: ExportJobTraceContext;
};
