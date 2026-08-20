import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from "prom-client";

import {
  EXPORT_JOB_METRIC_STATUS,
  type ExportJobMetricStatus,
  METRIC_NAME,
  QUOTA_REJECTION_METRIC_KIND,
  type QuotaRejectionMetricKind,
  STRIPE_WEBHOOK_METRIC_OUTCOME,
  type StripeWebhookMetricOutcome,
} from "./metrics.constants";

const metricsRegistry = new Registry();

if (process.env.JEST_WORKER_ID === undefined) {
  collectDefaultMetrics({ register: metricsRegistry });
}

const httpRequestsTotal = new Counter({
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"] as const,
  name: METRIC_NAME.httpRequestsTotal,
  registers: [metricsRegistry],
});

const httpRequestDurationSeconds = new Histogram({
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route"] as const,
  name: METRIC_NAME.httpRequestDurationSeconds,
  registers: [metricsRegistry],
});

const exportJobsTotal = new Counter({
  help: "Total export jobs processed",
  labelNames: ["status"] as const,
  name: METRIC_NAME.exportJobsTotal,
  registers: [metricsRegistry],
});

const exportJobDurationSeconds = new Histogram({
  help: "Export job duration in seconds",
  name: METRIC_NAME.exportJobDurationSeconds,
  registers: [metricsRegistry],
});

const quotaRejectionsTotal = new Counter({
  help: "Total plan quota rejections",
  labelNames: ["kind"] as const,
  name: METRIC_NAME.quotaRejectionsTotal,
  registers: [metricsRegistry],
});

const stripeWebhooksTotal = new Counter({
  help: "Total Stripe webhook outcomes",
  labelNames: ["outcome"] as const,
  name: METRIC_NAME.stripeWebhooksTotal,
  registers: [metricsRegistry],
});

function initAlertCounterLabelsets(): void {
  // Seed known labels at 0 so Prometheus `increase()` sees the first event.
  for (const status of Object.values(EXPORT_JOB_METRIC_STATUS)) {
    exportJobsTotal.inc({ status }, 0);
  }

  for (const kind of Object.values(QUOTA_REJECTION_METRIC_KIND)) {
    quotaRejectionsTotal.inc({ kind }, 0);
  }

  for (const outcome of Object.values(STRIPE_WEBHOOK_METRIC_OUTCOME)) {
    stripeWebhooksTotal.inc({ outcome }, 0);
  }
}

initAlertCounterLabelsets();

function contentType(): string {
  return metricsRegistry.contentType;
}

function render(): Promise<string> {
  return metricsRegistry.metrics();
}

export function resetMetrics(): void {
  metricsRegistry.resetMetrics();
  initAlertCounterLabelsets();
}

function recordHttpRequest(input: {
  durationSeconds: number;
  method: string;
  route: string;
  statusCode: number;
}): void {
  const labels = {
    method: input.method,
    route: input.route,
  };

  httpRequestsTotal.inc({
    ...labels,
    status_code: String(input.statusCode),
  });
  httpRequestDurationSeconds.observe(labels, input.durationSeconds);
}

function recordExportJob(status: ExportJobMetricStatus): void {
  exportJobsTotal.inc({ status });
}

function startExportJobTimer(): () => number {
  return exportJobDurationSeconds.startTimer();
}

function recordQuotaRejection(kind: QuotaRejectionMetricKind): void {
  quotaRejectionsTotal.inc({ kind });
}

function recordStripeWebhook(outcome: StripeWebhookMetricOutcome): void {
  stripeWebhooksTotal.inc({ outcome });
}

function getMetricsAsJSON() {
  return metricsRegistry.getMetricsAsJSON();
}

export const Metrics = {
  contentType,
  getMetricsAsJSON,
  recordExportJob,
  recordHttpRequest,
  recordQuotaRejection,
  recordStripeWebhook,
  render,
  startExportJobTimer,
};
