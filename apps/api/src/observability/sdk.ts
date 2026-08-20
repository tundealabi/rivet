import type { IncomingMessage } from "node:http";

import {
  diag,
  DiagConsoleLogger,
  type DiagLogFunction,
  type DiagLogger,
  DiagLogLevel,
} from "@opentelemetry/api";
import {
  type ExportResult,
  ExportResultCode,
  getBooleanFromEnv,
} from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { AwsInstrumentation } from "@opentelemetry/instrumentation-aws-sdk";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { IORedisInstrumentation } from "@opentelemetry/instrumentation-ioredis";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  AlwaysOffSampler,
  AlwaysOnSampler,
  ParentBasedSampler,
  type Sampler,
  TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";
import {
  ConsoleSpanExporter,
  type ReadableSpan,
  type SpanExporter,
} from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";

import {
  OTEL_SERVICE_NAME,
  TRACE_EXPORTER,
  TRACE_SAMPLER,
  type TraceExporterName,
  type TraceSamplerName,
} from "./constants";

let sdk: NodeSDK | undefined;
let started = false;

export function isOtelSdkDisabled(): boolean {
  if (getBooleanFromEnv("OTEL_SDK_DISABLED")) {
    return true;
  }

  if (process.env.JEST_WORKER_ID !== undefined) {
    return true;
  }

  return resolveTraceExporter() === TRACE_EXPORTER.none;
}

export function isOpenTelemetryStarted(): boolean {
  return started;
}

export function startOpenTelemetry(): void {
  if (started || isOtelSdkDisabled()) {
    return;
  }

  diag.setLogger(createSoftFailDiagLogger(), DiagLogLevel.ERROR);

  try {
    const exporter = createTraceExporter();

    if (exporter === null) {
      return;
    }

    sdk = new NodeSDK({
      instrumentations: [
        new HttpInstrumentation({
          ignoreIncomingRequestHook: isProbeIncomingRequest,
          ignoreOutgoingRequestHook: isTelemetryOutgoingRequest,
        }),
        new PgInstrumentation({
          requireParentSpan: true,
        }),
        new PrismaInstrumentation(),
        new IORedisInstrumentation(),
        new AwsInstrumentation({
          suppressInternalInstrumentation: true,
        }),
      ],
      logRecordProcessors: [],
      metricReaders: [],
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: OTEL_SERVICE_NAME,
      }),
      sampler: createSampler(),
      serviceName: OTEL_SERVICE_NAME,
      traceExporter: exporter,
    });

    sdk.start();
    started = true;
    registerProcessShutdown();
  } catch (error) {
    sdk = undefined;
    started = false;
    console.warn(
      "OpenTelemetry SDK failed to start; continuing without traces",
      error
    );
  }
}

export async function shutdownOpenTelemetry(): Promise<void> {
  const instance = sdk;
  sdk = undefined;
  started = false;

  if (!instance) {
    return;
  }

  try {
    await instance.shutdown();
  } catch {
    // Tempo / OTLP down must not block process exit.
  }
}

export function createTraceExporter(): SpanExporter | null {
  const exporter = resolveTraceExporter();

  if (exporter === TRACE_EXPORTER.none) {
    return null;
  }

  if (exporter === TRACE_EXPORTER.console) {
    return new ConsoleSpanExporter();
  }

  const timeoutMillis = resolveOtlpExportTimeoutMillis();

  return softFailExporter(
    new OTLPTraceExporter(
      timeoutMillis === undefined ? undefined : { timeoutMillis }
    )
  );
}

export function resolveOtlpExportTimeoutMillis(): number | undefined {
  const raw = (
    process.env.OTEL_EXPORTER_OTLP_TRACES_TIMEOUT ??
    process.env.OTEL_EXPORTER_OTLP_TIMEOUT ??
    ""
  ).trim();

  if (raw.length === 0) {
    return undefined;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

export function createSampler(): Sampler {
  const name = resolveTraceSampler();
  const ratio = resolveTraceSamplerRatio();

  switch (name) {
    case TRACE_SAMPLER.alwaysOff:
      return new AlwaysOffSampler();
    case TRACE_SAMPLER.alwaysOn:
      return new AlwaysOnSampler();
    case TRACE_SAMPLER.traceIdRatio:
      return new TraceIdRatioBasedSampler(ratio);
    case TRACE_SAMPLER.parentBasedAlwaysOff:
      return new ParentBasedSampler({ root: new AlwaysOffSampler() });
    case TRACE_SAMPLER.parentBasedAlwaysOn:
      return new ParentBasedSampler({ root: new AlwaysOnSampler() });
    case TRACE_SAMPLER.parentBasedTraceIdRatio:
      return new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(ratio),
      });
  }
}

export function softFailExporter(inner: SpanExporter): SpanExporter {
  return {
    export(
      spans: ReadableSpan[],
      resultCallback: (result: ExportResult) => void
    ): void {
      try {
        inner.export(spans, (result) => {
          resultCallback(
            result.code === ExportResultCode.SUCCESS
              ? result
              : { code: ExportResultCode.SUCCESS }
          );
        });
      } catch {
        resultCallback({ code: ExportResultCode.SUCCESS });
      }
    },
    forceFlush(): Promise<void> {
      if (inner.forceFlush === undefined) {
        return Promise.resolve();
      }

      return inner.forceFlush().catch(() => undefined);
    },
    shutdown(): Promise<void> {
      return inner.shutdown().catch(() => undefined);
    },
  };
}

function resolveTraceExporter(): TraceExporterName {
  const raw = (process.env.OTEL_TRACES_EXPORTER ?? TRACE_EXPORTER.otlp)
    .trim()
    .toLowerCase();

  if (
    raw === TRACE_EXPORTER.console ||
    raw === TRACE_EXPORTER.none ||
    raw === TRACE_EXPORTER.otlp
  ) {
    return raw;
  }

  return TRACE_EXPORTER.otlp;
}

function isProbeIncomingRequest(request: IncomingMessage): boolean {
  const path = (request.url ?? "").split("?")[0]?.replace(/\/+$/, "") || "/";

  return path === "/health" || path === "/metrics" || path === "/ready";
}

function resolveTraceSampler(): TraceSamplerName {
  const raw = (process.env.OTEL_TRACES_SAMPLER ?? TRACE_SAMPLER.alwaysOn)
    .trim()
    .toLowerCase();

  if (
    raw === TRACE_SAMPLER.alwaysOff ||
    raw === TRACE_SAMPLER.alwaysOn ||
    raw === TRACE_SAMPLER.traceIdRatio ||
    raw === TRACE_SAMPLER.parentBasedAlwaysOff ||
    raw === TRACE_SAMPLER.parentBasedAlwaysOn ||
    raw === TRACE_SAMPLER.parentBasedTraceIdRatio
  ) {
    return raw;
  }

  return TRACE_SAMPLER.alwaysOn;
}

function resolveTraceSamplerRatio(): number {
  const raw = (process.env.OTEL_TRACES_SAMPLER_ARG ?? "1").trim();
  const parsed = Number.parseFloat(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 1;
  }

  if (parsed > 1) {
    return 1;
  }

  return parsed;
}

function isTelemetryOutgoingRequest(request: { path?: unknown }): boolean {
  if (typeof request.path !== "string") {
    return false;
  }

  return (
    request.path.includes("/v1/traces") ||
    request.path.includes("/api/prom/push") ||
    request.path.includes("/api/v1/write")
  );
}

function registerProcessShutdown(): void {
  const shutdown = () => {
    void shutdownOpenTelemetry();
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

function createSoftFailDiagLogger(): DiagLogger {
  const inner = new DiagConsoleLogger();
  const debug: DiagLogFunction = (message, ...args) => {
    inner.debug(message, ...args);
  };
  const error: DiagLogFunction = (message, ...args) => {
    inner.error(message, ...args);
  };
  const info: DiagLogFunction = (message, ...args) => {
    inner.info(message, ...args);
  };
  const verbose: DiagLogFunction = (message, ...args) => {
    inner.verbose(message, ...args);
  };
  const warn: DiagLogFunction = (message, ...args) => {
    inner.warn(message, ...args);
  };

  return {
    debug,
    error: silenceUnreachable(error),
    info,
    verbose,
    warn: silenceUnreachable(warn),
  };
}

function silenceUnreachable(log: DiagLogFunction): DiagLogFunction {
  return (message, ...args) => {
    if (isUnreachableExporterMessage(message, args)) {
      return;
    }

    log(message, ...args);
  };
}

function isUnreachableExporterMessage(
  message: string,
  args: unknown[]
): boolean {
  const haystack = [message, ...args.map(String)].join(" ");

  return /ECONNREFUSED|ENOTFOUND|ECONNRESET|ETIMEDOUT|fetch failed|socket hang up|connect timeout/i.test(
    haystack
  );
}
