import { buildRequestErrorLog } from "./request-error-log";

describe("buildRequestErrorLog", () => {
  it("redacts password and token fields on login-like bodies", () => {
    const log = buildRequestErrorLog({
      body: { email: "ada@example.com", password: "secret" },
      method: "POST",
      originalUrl: "/api/v1/auth/login",
      params: {},
      path: "/api/v1/auth/login",
      query: {},
      requestId: "req-1",
    } as never);

    expect(log.body).toEqual({
      email: "ada@example.com",
      password: "[REDACTED]",
    });
    expect(log.requestId).toBe("req-1");
  });

  it("redacts token query params on the url", () => {
    const log = buildRequestErrorLog({
      body: {},
      method: "GET",
      originalUrl: "/api/v1/invitations/preview?token=abc.def",
      params: {},
      path: "/api/v1/invitations/preview",
      query: { token: "abc.def" },
      requestId: "req-2",
    } as never);

    expect(log.url).toBe("/api/v1/invitations/preview?token=[REDACTED]");
    expect(log.query).toEqual({ token: "[REDACTED]" });
  });

  it("omits the Stripe webhook body", () => {
    const log = buildRequestErrorLog({
      body: { id: "evt_1", type: "customer.subscription.updated", data: {} },
      method: "POST",
      originalUrl: "/api/v1/webhooks/stripe",
      params: {},
      path: "/api/v1/webhooks/stripe",
      query: {},
      requestId: "req-3",
    } as never);

    expect(log).not.toHaveProperty("body");
    expect(log.url).toBe("/api/v1/webhooks/stripe");
  });
});
