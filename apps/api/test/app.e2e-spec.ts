import type { HealthCheckResult } from "@nestjs/terminus";
import request from "supertest";

import { API_PREFIX } from "./helpers/constants";
import { createE2eApp } from "./helpers/e2e-app.helper";

describe("Health probes (e2e)", () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /health returns Terminus live JSON without the API envelope", async () => {
    const res = await request(app.getHttpServer()).get("/health").expect(200);

    const body = res.body as HealthCheckResult;

    expect(body.status).toBe("ok");
    expect(body).not.toHaveProperty("state");
    expect(body).not.toHaveProperty("requestId");
    expect(res.headers["x-request-id"]).toEqual(expect.any(String));
  });

  it("GET /ready returns 200 when Postgres and Redis are up", async () => {
    const res = await request(app.getHttpServer()).get("/ready").expect(200);

    const body = res.body as HealthCheckResult;

    expect(body.status).toBe("ok");
    expect(body.info?.postgres?.status).toBe("up");
    expect(body.info?.redis?.status).toBe("up");
    expect(body).not.toHaveProperty("state");
  });

  it("does not serve Hello World on GET /api/v1", async () => {
    const res = await request(app.getHttpServer()).get(API_PREFIX).expect(404);
    const body = res.body as { requestId?: string };

    expect(res.headers["x-request-id"]).toBe(body.requestId);
  });
});

describe("Prometheus metrics (e2e)", () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /metrics returns Prometheus text including http_requests_total", async () => {
    await request(app.getHttpServer())
      .post(`${API_PREFIX}/auth/login`)
      .send({})
      .expect(400);

    const res = await request(app.getHttpServer()).get("/metrics").expect(200);

    expect(res.headers["content-type"]).toMatch(/text\/plain/);
    expect(res.headers["content-type"]).toMatch(/version=0\.0\.4/);
    expect(res.text).toContain("http_requests_total");
    expect(res.text).toMatch(
      /http_requests_total\{method="POST",route="[^"]*auth\/login",status_code="400"\} [1-9]\d*/
    );
  });
});

describe("Health probes throttling (e2e)", () => {
  it("does not rate-limit GET /health", async () => {
    const app = await createE2eApp({ throttle: true });

    try {
      for (let index = 0; index < 5; index += 1) {
        await request(app.getHttpServer()).get("/health").expect(200);
      }
    } finally {
      await app.close();
    }
  });

  it("does not rate-limit GET /metrics", async () => {
    const app = await createE2eApp({ throttle: true });

    try {
      for (let index = 0; index < 5; index += 1) {
        await request(app.getHttpServer()).get("/metrics").expect(200);
      }
    } finally {
      await app.close();
    }
  });
});

describe("Prometheus metrics bearer (e2e)", () => {
  const originalToken = process.env.OTEL_METRICS_BEARER_TOKEN;

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.OTEL_METRICS_BEARER_TOKEN;
      return;
    }

    process.env.OTEL_METRICS_BEARER_TOKEN = originalToken;
  });

  it("returns 401 when a token is configured and the header is missing", async () => {
    process.env.OTEL_METRICS_BEARER_TOKEN = "metrics-secret";
    const app = await createE2eApp();

    try {
      const res = await request(app.getHttpServer())
        .get("/metrics")
        .expect(401);

      expect(res.body).not.toHaveProperty("state");
      expect(res.body).not.toHaveProperty("requestId");
    } finally {
      await app.close();
    }
  });

  it("returns Prometheus text when the bearer token matches", async () => {
    process.env.OTEL_METRICS_BEARER_TOKEN = "metrics-secret";
    const app = await createE2eApp();

    try {
      const res = await request(app.getHttpServer())
        .get("/metrics")
        .set("Authorization", "Bearer metrics-secret")
        .expect(200);

      expect(res.headers["content-type"]).toMatch(/text\/plain/);
      expect(res.text).toContain("http_requests_total");
    } finally {
      await app.close();
    }
  });
});
