import { pushTimeseries } from "prometheus-remote-write";

import { NodeEnv } from "@/common/enums";

import { OTEL_SERVICE_NAME, REMOTE_WRITE_INTERVAL_MS } from "./constants";
import { Metrics } from "./metrics";

export type PrometheusMetricJson = {
  name: string;
  values: Array<{
    labels: Record<string, string | number>;
    metricName?: string;
    value: number;
  }>;
};

export type RemoteWriteTimeseries = {
  labels: {
    __name__: string;
    [key: string]: string;
  };
  samples: Array<{ timestamp: number; value: number }>;
};

export type MetricsRemoteWriteConfig = {
  labels: Record<string, string>;
  password?: string;
  url: string;
  username?: string;
};

let started = false;
let timer: NodeJS.Timeout | undefined;
let inFlight = false;

export function isMetricsRemoteWriteStarted(): boolean {
  return started;
}

export function isMetricsRemoteWriteEnabled(): boolean {
  if (process.env.JEST_WORKER_ID !== undefined) {
    return false;
  }

  return resolveMetricsRemoteWriteConfig() !== null;
}

export function resolveMetricsRemoteWriteConfig(): MetricsRemoteWriteConfig | null {
  const url = process.env.OTEL_METRICS_REMOTE_WRITE_URL?.trim();

  if (!url) {
    return null;
  }

  const username = process.env.OTEL_METRICS_REMOTE_WRITE_USERNAME?.trim();
  const password = process.env.OTEL_METRICS_REMOTE_WRITE_PASSWORD?.trim();
  const environment = process.env.NODE_ENV?.trim() || NodeEnv.DEVELOPMENT;

  return {
    labels: {
      environment,
      service: OTEL_SERVICE_NAME,
    },
    ...(password ? { password } : {}),
    url,
    ...(username ? { username } : {}),
  };
}

export function metricsJsonToTimeseries(
  metrics: PrometheusMetricJson[],
  timestampMs: number
): RemoteWriteTimeseries[] {
  const series: RemoteWriteTimeseries[] = [];

  for (const metric of metrics) {
    for (const point of metric.values) {
      if (!Number.isFinite(point.value)) {
        continue;
      }

      const name = point.metricName ?? metric.name;
      const labels: RemoteWriteTimeseries["labels"] = { __name__: name };

      for (const [key, value] of Object.entries(point.labels)) {
        labels[key] = String(value);
      }

      series.push({
        labels,
        samples: [{ timestamp: timestampMs, value: point.value }],
      });
    }
  }

  return series;
}

export function startMetricsRemoteWrite(): void {
  if (started || !isMetricsRemoteWriteEnabled()) {
    return;
  }

  started = true;
  timer = setInterval(() => {
    void flushMetricsRemoteWrite();
  }, REMOTE_WRITE_INTERVAL_MS);
  void flushMetricsRemoteWrite();
  registerProcessShutdown();
}

export async function shutdownMetricsRemoteWrite(): Promise<void> {
  started = false;

  if (timer !== undefined) {
    clearInterval(timer);
    timer = undefined;
  }

  if (inFlight) {
    return;
  }

  await flushMetricsRemoteWrite();
}

async function flushMetricsRemoteWrite(): Promise<void> {
  const config = resolveMetricsRemoteWriteConfig();

  if (!config || inFlight) {
    return;
  }

  inFlight = true;

  try {
    const metrics =
      (await Metrics.getMetricsAsJSON()) as PrometheusMetricJson[];
    const timeseries = metricsJsonToTimeseries(metrics, Date.now());

    if (timeseries.length === 0) {
      return;
    }

    await pushTimeseries(timeseries, {
      auth:
        config.username !== undefined && config.password !== undefined
          ? { password: config.password, username: config.username }
          : undefined,
      fetch: prometheusRemoteWriteFetch,
      labels: config.labels,
      url: config.url,
    });
  } catch {
    // Grafana Cloud / remote_write down must not take the API down.
  } finally {
    inFlight = false;
  }
}

function prometheusRemoteWriteFetch(
  url: string,
  init?: {
    body: ArrayBufferLike;
    headers: { [key: string]: string };
    method: string;
    timeout?: number;
  }
): Promise<{
  status: number;
  statusText: string;
  text: () => Promise<string>;
}> {
  return globalThis.fetch(url, {
    body: init?.body as BodyInit,
    headers: init?.headers,
    method: init?.method,
  });
}

function registerProcessShutdown(): void {
  const shutdown = () => {
    void shutdownMetricsRemoteWrite();
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
