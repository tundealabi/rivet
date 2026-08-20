import {
  context,
  propagation,
  SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";

import { OTEL_SERVICE_NAME, SPAN_ATTR, SPAN_NAME } from "./constants";

export type JobTraceContext = Record<string, string>;

export type JobTraceFields = {
  requestId?: string;
  traceContext?: JobTraceContext;
};

export type ExportProcessSpanInput = {
  exportJobId: string;
  organizationId: string;
} & JobTraceFields;

function setRequestId(requestId: string): void {
  const span = trace.getActiveSpan();

  if (!span?.isRecording()) {
    return;
  }

  span.setAttribute(SPAN_ATTR.requestId, requestId);
}

function requestId(): string | undefined {
  const value = propagation
    .getActiveBaggage()
    ?.getEntry(SPAN_ATTR.requestId)?.value;

  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  return value;
}

function runWithRequestId<T>(requestId: string, fn: () => T): T {
  setRequestId(requestId);

  const parent = context.active();
  const baggage = (
    propagation.getBaggage(parent) ?? propagation.createBaggage()
  ).setEntry(SPAN_ATTR.requestId, { value: requestId });

  return context.with(propagation.setBaggage(parent, baggage), fn);
}

function injectJobContext<T extends object>(payload: T): T & JobTraceFields {
  const carrier: JobTraceContext = {};
  propagation.inject(context.active(), carrier);

  const spanRequestId =
    "requestId" in payload &&
    typeof payload.requestId === "string" &&
    payload.requestId.length > 0
      ? payload.requestId
      : requestId();

  return {
    ...payload,
    ...(spanRequestId ? { requestId: spanRequestId } : {}),
    ...(Object.keys(carrier).length > 0 ? { traceContext: carrier } : {}),
  };
}

async function runWithExportProcess<T>(
  payload: ExportProcessSpanInput,
  fn: () => Promise<T>
): Promise<T> {
  let parentContext = propagation.extract(
    context.active(),
    payload.traceContext ?? {}
  );

  if (payload.requestId) {
    const baggage = (
      propagation.getBaggage(parentContext) ?? propagation.createBaggage()
    ).setEntry(SPAN_ATTR.requestId, { value: payload.requestId });
    parentContext = propagation.setBaggage(parentContext, baggage);
  }

  const tracer = trace.getTracer(OTEL_SERVICE_NAME);

  return tracer.startActiveSpan(
    SPAN_NAME.exportProcess,
    {
      attributes: {
        [SPAN_ATTR.exportJobId]: payload.exportJobId,
        [SPAN_ATTR.organizationId]: payload.organizationId,
        ...(payload.requestId
          ? { [SPAN_ATTR.requestId]: payload.requestId }
          : {}),
      },
      kind: SpanKind.INTERNAL,
    },
    parentContext,
    async (span) => {
      try {
        return await fn();
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: errorMessage(error),
        });
        span.recordException(toException(error));
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
}

function toException(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export const Trace = {
  injectJobContext,
  requestId,
  runWithExportProcess,
  runWithRequestId,
  setRequestId,
};
