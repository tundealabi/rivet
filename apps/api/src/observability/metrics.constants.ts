export const METRIC_NAME = {
  exportJobDurationSeconds: "export_job_duration_seconds",
  exportJobsTotal: "export_jobs_total",
  httpRequestDurationSeconds: "http_request_duration_seconds",
  httpRequestsTotal: "http_requests_total",
  quotaRejectionsTotal: "quota_rejections_total",
  stripeWebhooksTotal: "stripe_webhooks_total",
} as const;

export const EXPORT_JOB_METRIC_STATUS = {
  failed: "failed",
  succeeded: "succeeded",
} as const;

export type ExportJobMetricStatus =
  (typeof EXPORT_JOB_METRIC_STATUS)[keyof typeof EXPORT_JOB_METRIC_STATUS];

export const STRIPE_WEBHOOK_METRIC_OUTCOME = {
  already_processed: "already_processed",
  applied: "applied",
  bad_signature: "bad_signature",
  error: "error",
  ignored: "ignored",
} as const;

export type StripeWebhookMetricOutcome =
  (typeof STRIPE_WEBHOOK_METRIC_OUTCOME)[keyof typeof STRIPE_WEBHOOK_METRIC_OUTCOME];

export const QUOTA_REJECTION_METRIC_KIND = {
  exports: "exports",
  members: "members",
  projects: "projects",
} as const;

export type QuotaRejectionMetricKind =
  (typeof QUOTA_REJECTION_METRIC_KIND)[keyof typeof QUOTA_REJECTION_METRIC_KIND];
