import { context, SpanStatusCode, trace, TraceFlags } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import {
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";

import { SPAN_ATTR, SPAN_NAME } from "./constants";
import { Trace } from "./trace";

describe("Trace", () => {
  let exporter: InMemorySpanExporter;
  let provider: NodeTracerProvider;

  beforeAll(() => {
    exporter = new InMemorySpanExporter();
    provider = new NodeTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    provider.register({
      propagator: new W3CTraceContextPropagator(),
    });
  });

  afterEach(() => {
    exporter.reset();
  });

  afterAll(async () => {
    await provider.shutdown();
  });

  it("injects W3C traceparent and requestId from the active HTTP span", () => {
    const tracer = trace.getTracer("test");
    const parent = tracer.startSpan("POST /exports");

    const payload = context.with(trace.setSpan(context.active(), parent), () =>
      Trace.runWithRequestId("req-1", () =>
        Trace.injectJobContext({
          exportJobId: "job-1",
          organizationId: "org-1",
          requestedById: "user-1",
        })
      )
    );

    parent.end();

    expect(payload.requestId).toBe("req-1");
    expect(payload.traceContext?.traceparent).toEqual(
      expect.stringMatching(/^00-[0-9a-f]{32}-[0-9a-f]{16}-0[01]$/)
    );
  });

  it("starts export.process as a child of the injected parent", async () => {
    const tracer = trace.getTracer("test");
    const parent = tracer.startSpan("POST /exports");
    const payload = context.with(trace.setSpan(context.active(), parent), () =>
      Trace.injectJobContext({
        exportJobId: "job-1",
        organizationId: "org-1",
        requestId: "req-1",
        requestedById: "user-1",
      })
    );
    parent.end();

    await Trace.runWithExportProcess(payload, () => Promise.resolve());

    const spans = exporter.getFinishedSpans();
    const httpSpan = spans.find((span) => span.name === "POST /exports");
    const workerSpan = spans.find(
      (span) => span.name === SPAN_NAME.exportProcess
    );

    expect(httpSpan).toBeDefined();
    expect(workerSpan).toBeDefined();
    expect(workerSpan?.spanContext().traceId).toBe(
      httpSpan?.spanContext().traceId
    );
    expect(workerSpan?.parentSpanContext?.spanId).toBe(
      httpSpan?.spanContext().spanId
    );
    expect(workerSpan?.attributes[SPAN_ATTR.exportJobId]).toBe("job-1");
    expect(workerSpan?.attributes[SPAN_ATTR.organizationId]).toBe("org-1");
    expect(workerSpan?.attributes[SPAN_ATTR.requestId]).toBe("req-1");
    expect(workerSpan?.spanContext().traceFlags).toBe(TraceFlags.SAMPLED);
  });

  it("records an error status when the worker callback throws", async () => {
    await expect(
      Trace.runWithExportProcess(
        {
          exportJobId: "job-1",
          organizationId: "org-1",
        },
        () => Promise.reject(new Error("S3 down"))
      )
    ).rejects.toThrow("S3 down");

    const workerSpan = exporter
      .getFinishedSpans()
      .find((span) => span.name === SPAN_NAME.exportProcess);

    expect(workerSpan?.status.code).toBe(SpanStatusCode.ERROR);
    expect(workerSpan?.status.message).toBe("S3 down");
  });

  it("sets requestId on the recording active span", () => {
    const tracer = trace.getTracer("test");
    const span = tracer.startSpan("http");

    context.with(trace.setSpan(context.active(), span), () => {
      Trace.setRequestId("req-2");
    });
    span.end();

    expect(
      exporter.getFinishedSpans()[0]?.attributes[SPAN_ATTR.requestId]
    ).toBe("req-2");
  });
});
