import { ExportResultCode } from "@opentelemetry/core";
import {
  AlwaysOffSampler,
  AlwaysOnSampler,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";
import {
  ConsoleSpanExporter,
  type SpanExporter,
} from "@opentelemetry/sdk-trace-node";

import {
  createSampler,
  createTraceExporter,
  isOpenTelemetryStarted,
  isOtelSdkDisabled,
  resolveOtlpExportTimeoutMillis,
  softFailExporter,
  startOpenTelemetry,
} from "./sdk";

function restoreEnv(key: string, original: string | undefined): void {
  if (original === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = original;
}

describe("OpenTelemetry SDK helpers", () => {
  const originalExporter = process.env.OTEL_TRACES_EXPORTER;
  const originalSampler = process.env.OTEL_TRACES_SAMPLER;
  const originalSamplerArg = process.env.OTEL_TRACES_SAMPLER_ARG;
  const originalTimeout = process.env.OTEL_EXPORTER_OTLP_TIMEOUT;
  const originalTracesTimeout = process.env.OTEL_EXPORTER_OTLP_TRACES_TIMEOUT;

  afterEach(() => {
    restoreEnv("OTEL_TRACES_EXPORTER", originalExporter);
    restoreEnv("OTEL_TRACES_SAMPLER", originalSampler);
    restoreEnv("OTEL_TRACES_SAMPLER_ARG", originalSamplerArg);
    restoreEnv("OTEL_EXPORTER_OTLP_TIMEOUT", originalTimeout);
    restoreEnv("OTEL_EXPORTER_OTLP_TRACES_TIMEOUT", originalTracesTimeout);
  });

  it("treats Jest as SDK-disabled", () => {
    expect(process.env.OTEL_SDK_DISABLED).toBe("true");
    expect(isOtelSdkDisabled()).toBe(true);
  });

  it("does not start exporters under Jest", () => {
    startOpenTelemetry();
    expect(isOpenTelemetryStarted()).toBe(false);
  });

  it("returns a console exporter when OTEL_TRACES_EXPORTER=console", () => {
    process.env.OTEL_TRACES_EXPORTER = "console";

    expect(createTraceExporter()).toBeInstanceOf(ConsoleSpanExporter);
  });

  it("returns null when OTEL_TRACES_EXPORTER=none", () => {
    process.env.OTEL_TRACES_EXPORTER = "none";

    expect(createTraceExporter()).toBeNull();
  });

  it("does not hardcode a 1s OTLP timeout", () => {
    delete process.env.OTEL_EXPORTER_OTLP_TIMEOUT;
    delete process.env.OTEL_EXPORTER_OTLP_TRACES_TIMEOUT;

    expect(resolveOtlpExportTimeoutMillis()).toBeUndefined();
  });

  it("honors OTEL_EXPORTER_OTLP_TIMEOUT", () => {
    process.env.OTEL_EXPORTER_OTLP_TIMEOUT = "15000";
    delete process.env.OTEL_EXPORTER_OTLP_TRACES_TIMEOUT;

    expect(resolveOtlpExportTimeoutMillis()).toBe(15000);
  });

  it("prefers OTEL_EXPORTER_OTLP_TRACES_TIMEOUT", () => {
    process.env.OTEL_EXPORTER_OTLP_TIMEOUT = "15000";
    process.env.OTEL_EXPORTER_OTLP_TRACES_TIMEOUT = "20000";

    expect(resolveOtlpExportTimeoutMillis()).toBe(20000);
  });

  it("defaults the sampler to always-on", () => {
    delete process.env.OTEL_TRACES_SAMPLER;

    expect(createSampler()).toBeInstanceOf(AlwaysOnSampler);
  });

  it("honors OTEL_TRACES_SAMPLER=always_off", () => {
    process.env.OTEL_TRACES_SAMPLER = "always_off";

    expect(createSampler()).toBeInstanceOf(AlwaysOffSampler);
  });

  it("honors parentbased_traceidratio", () => {
    process.env.OTEL_TRACES_SAMPLER = "parentbased_traceidratio";
    process.env.OTEL_TRACES_SAMPLER_ARG = "0.1";

    expect(createSampler()).toBeInstanceOf(ParentBasedSampler);
  });

  it("honors traceidratio", () => {
    process.env.OTEL_TRACES_SAMPLER = "traceidratio";
    process.env.OTEL_TRACES_SAMPLER_ARG = "0.25";

    expect(createSampler()).toBeInstanceOf(TraceIdRatioBasedSampler);
  });

  it("falls back to always-on for an unknown sampler", () => {
    process.env.OTEL_TRACES_SAMPLER = "not-a-sampler";

    expect(createSampler()).toBeInstanceOf(AlwaysOnSampler);
  });

  it("reports SUCCESS when the inner OTLP exporter fails", () => {
    const inner: SpanExporter = {
      export: (_spans, resultCallback) => {
        resultCallback({
          code: ExportResultCode.FAILED,
          error: new Error("ECONNREFUSED"),
        });
      },
      shutdown: () => Promise.resolve(),
    };
    const callback = jest.fn();

    softFailExporter(inner).export([], callback);

    expect(callback).toHaveBeenCalledWith({ code: ExportResultCode.SUCCESS });
  });
});
