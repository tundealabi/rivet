import {
  isMetricsRemoteWriteEnabled,
  isMetricsRemoteWriteStarted,
  metricsJsonToTimeseries,
  resolveMetricsRemoteWriteConfig,
  startMetricsRemoteWrite,
} from "./remote-write";

function restoreEnv(key: string, original: string | undefined): void {
  if (original === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = original;
}

describe("metrics remote write", () => {
  const originalUrl = process.env.OTEL_METRICS_REMOTE_WRITE_URL;
  const originalUsername = process.env.OTEL_METRICS_REMOTE_WRITE_USERNAME;
  const originalPassword = process.env.OTEL_METRICS_REMOTE_WRITE_PASSWORD;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    restoreEnv("OTEL_METRICS_REMOTE_WRITE_URL", originalUrl);
    restoreEnv("OTEL_METRICS_REMOTE_WRITE_USERNAME", originalUsername);
    restoreEnv("OTEL_METRICS_REMOTE_WRITE_PASSWORD", originalPassword);
    restoreEnv("NODE_ENV", originalNodeEnv);
  });

  it("is disabled without a remote_write URL", () => {
    delete process.env.OTEL_METRICS_REMOTE_WRITE_URL;

    expect(resolveMetricsRemoteWriteConfig()).toBeNull();
  });

  it("reads Grafana Cloud remote_write env", () => {
    process.env.OTEL_METRICS_REMOTE_WRITE_URL =
      "https://prometheus-prod-example.grafana.net/api/prom/push";
    process.env.OTEL_METRICS_REMOTE_WRITE_USERNAME = "12345";
    process.env.OTEL_METRICS_REMOTE_WRITE_PASSWORD = "glc_token";
    process.env.NODE_ENV = "production";

    expect(resolveMetricsRemoteWriteConfig()).toEqual({
      labels: {
        environment: "production",
        service: "rivet-api",
      },
      password: "glc_token",
      url: "https://prometheus-prod-example.grafana.net/api/prom/push",
      username: "12345",
    });
  });

  it("does not start under Jest even when a URL is set", () => {
    process.env.OTEL_METRICS_REMOTE_WRITE_URL =
      "https://prometheus-prod-example.grafana.net/api/prom/push";

    expect(isMetricsRemoteWriteEnabled()).toBe(false);
    startMetricsRemoteWrite();
    expect(isMetricsRemoteWriteStarted()).toBe(false);
  });

  it("converts counter and histogram JSON to remote_write timeseries", () => {
    const series = metricsJsonToTimeseries(
      [
        {
          name: "http_requests_total",
          values: [
            {
              labels: {
                method: "GET",
                route: "/api/v1/issues/:id",
                status_code: 200,
              },
              value: 3,
            },
          ],
        },
        {
          name: "http_request_duration_seconds",
          values: [
            {
              labels: { le: "0.1", method: "GET", route: "/api/v1/issues/:id" },
              metricName: "http_request_duration_seconds_bucket",
              value: 2,
            },
            {
              labels: { method: "GET", route: "/api/v1/issues/:id" },
              metricName: "http_request_duration_seconds_sum",
              value: 0.042,
            },
            {
              labels: { method: "GET", route: "/api/v1/issues/:id" },
              metricName: "http_request_duration_seconds_count",
              value: 2,
            },
          ],
        },
      ],
      1_700_000_000_000
    );

    expect(series).toEqual([
      {
        labels: {
          __name__: "http_requests_total",
          method: "GET",
          route: "/api/v1/issues/:id",
          status_code: "200",
        },
        samples: [{ timestamp: 1_700_000_000_000, value: 3 }],
      },
      {
        labels: {
          __name__: "http_request_duration_seconds_bucket",
          le: "0.1",
          method: "GET",
          route: "/api/v1/issues/:id",
        },
        samples: [{ timestamp: 1_700_000_000_000, value: 2 }],
      },
      {
        labels: {
          __name__: "http_request_duration_seconds_sum",
          method: "GET",
          route: "/api/v1/issues/:id",
        },
        samples: [{ timestamp: 1_700_000_000_000, value: 0.042 }],
      },
      {
        labels: {
          __name__: "http_request_duration_seconds_count",
          method: "GET",
          route: "/api/v1/issues/:id",
        },
        samples: [{ timestamp: 1_700_000_000_000, value: 2 }],
      },
    ]);
  });

  it("skips non-finite metric values", () => {
    const series = metricsJsonToTimeseries(
      [
        {
          name: "broken",
          values: [
            { labels: {}, value: Number.NaN },
            { labels: {}, value: Number.POSITIVE_INFINITY },
          ],
        },
      ],
      1
    );

    expect(series).toEqual([]);
  });
});
