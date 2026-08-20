import { Metrics, resetMetrics } from "./metrics";
import { METRIC_NAME } from "./metrics.constants";

describe("metrics", () => {
  beforeEach(() => {
    resetMetrics();
  });

  it("zero-initializes alert counter labelsets", async () => {
    const text = await Metrics.render();

    expect(text).toContain('export_jobs_total{status="failed"} 0');
    expect(text).toContain('quota_rejections_total{kind="projects"} 0');
    expect(text).toContain('stripe_webhooks_total{outcome="error"} 0');
  });

  it("renders registered HTTP and business metric names", async () => {
    const text = await Metrics.render();

    expect(text).toContain(METRIC_NAME.httpRequestsTotal);
    expect(text).toContain(METRIC_NAME.httpRequestDurationSeconds);
    expect(text).toContain(METRIC_NAME.exportJobsTotal);
    expect(text).toContain(METRIC_NAME.exportJobDurationSeconds);
    expect(text).toContain(METRIC_NAME.quotaRejectionsTotal);
    expect(text).toContain(METRIC_NAME.stripeWebhooksTotal);
  });

  it("records HTTP counter and histogram with route template labels", async () => {
    Metrics.recordHttpRequest({
      durationSeconds: 0.012,
      method: "GET",
      route: "/api/v1/issues/:id",
      statusCode: 200,
    });

    const text = await Metrics.render();

    expect(text).toContain(
      'http_requests_total{method="GET",route="/api/v1/issues/:id",status_code="200"} 1'
    );
    expect(text).toContain(
      'http_request_duration_seconds_count{method="GET",route="/api/v1/issues/:id"} 1'
    );
  });

  it("records export, quota, and webhook series", async () => {
    Metrics.recordExportJob("failed");
    Metrics.startExportJobTimer()();
    Metrics.recordQuotaRejection("exports");
    Metrics.recordStripeWebhook("bad_signature");

    const text = await Metrics.render();

    expect(text).toContain('export_jobs_total{status="failed"} 1');
    expect(text).toContain("export_job_duration_seconds_count 1");
    expect(text).toContain('quota_rejections_total{kind="exports"} 1');
    expect(text).toContain('stripe_webhooks_total{outcome="bad_signature"} 1');
  });
});
