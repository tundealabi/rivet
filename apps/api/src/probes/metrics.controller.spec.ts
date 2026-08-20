import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";

import { MetricsController } from "./metrics.controller";
import { MetricsBearerGuard } from "./metrics-bearer.guard";

function restoreEnv(key: string, original: string | undefined): void {
  if (original === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = original;
}

describe("MetricsController", () => {
  const originalToken = process.env.OTEL_METRICS_BEARER_TOKEN;
  let app: INestApplication<App>;

  afterEach(async () => {
    restoreEnv("OTEL_METRICS_BEARER_TOKEN", originalToken);

    if (app) {
      await app.close();
    }
  });

  async function createApp(): Promise<INestApplication<App>> {
    const module = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [MetricsBearerGuard],
    }).compile();

    const nestApp = module.createNestApplication();
    await nestApp.init();
    return nestApp;
  }

  it("returns Prometheus text when no token is configured", async () => {
    delete process.env.OTEL_METRICS_BEARER_TOKEN;
    app = await createApp();

    const res = await request(app.getHttpServer()).get("/metrics").expect(200);

    expect(res.headers["content-type"]).toMatch(/text\/plain/);
    expect(res.text).toContain("http_requests_total");
  });

  it("returns 401 when a token is configured and the header is missing", async () => {
    process.env.OTEL_METRICS_BEARER_TOKEN = "metrics-secret";
    app = await createApp();

    await request(app.getHttpServer()).get("/metrics").expect(401);
  });

  it("returns Prometheus text when the bearer token matches", async () => {
    process.env.OTEL_METRICS_BEARER_TOKEN = "metrics-secret";
    app = await createApp();

    const res = await request(app.getHttpServer())
      .get("/metrics")
      .set("Authorization", "Bearer metrics-secret")
      .expect(200);

    expect(res.text).toContain("http_requests_total");
  });
});
