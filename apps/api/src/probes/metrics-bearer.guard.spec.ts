import {
  authorizationMatchesBearer,
  readMetricsBearerToken,
} from "./metrics-bearer.guard";

function restoreEnv(key: string, original: string | undefined): void {
  if (original === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = original;
}

describe("metrics bearer token", () => {
  const original = process.env.OTEL_METRICS_BEARER_TOKEN;

  afterEach(() => {
    restoreEnv("OTEL_METRICS_BEARER_TOKEN", original);
  });

  it("treats missing and blank tokens as unset", () => {
    delete process.env.OTEL_METRICS_BEARER_TOKEN;
    expect(readMetricsBearerToken()).toBeUndefined();

    process.env.OTEL_METRICS_BEARER_TOKEN = "   ";
    expect(readMetricsBearerToken()).toBeUndefined();
  });

  it("accepts a matching Bearer header", () => {
    expect(
      authorizationMatchesBearer("Bearer metrics-secret", "metrics-secret")
    ).toBe(true);
  });

  it("rejects a missing, malformed, or wrong header", () => {
    expect(authorizationMatchesBearer(undefined, "metrics-secret")).toBe(false);
    expect(authorizationMatchesBearer("metrics-secret", "metrics-secret")).toBe(
      false
    );
    expect(
      authorizationMatchesBearer("Bearer other-secret", "metrics-secret")
    ).toBe(false);
  });
});
