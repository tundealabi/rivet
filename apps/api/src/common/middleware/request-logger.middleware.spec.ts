import { Logger } from "@nestjs/common";
import type { Request, Response } from "express";
import type { ClsService } from "nestjs-cls";
import { getClientIp } from "request-ip";

import type { TenantContextStore } from "@/common/constants";
import { Metrics } from "@/observability";

import { HttpRequestLoggerMiddleware } from "./request-logger.middleware";

jest.mock("request-ip", () => ({
  getClientIp: jest.fn(),
}));

const getClientIpMock = getClientIp as jest.MockedFunction<typeof getClientIp>;

function clsStub(store?: {
  orgId?: string;
  userId?: string;
}): ClsService<TenantContextStore> {
  return {
    isActive: () => store !== undefined,
    get: (key: string) => {
      if (key === "orgId") {
        return store?.orgId;
      }
      if (key === "userId") {
        return store?.userId;
      }
      return undefined;
    },
  } as unknown as ClsService<TenantContextStore>;
}

function responseStub(statusCode: number): {
  finish: () => void;
  once: jest.Mock;
  response: Response;
} {
  let onFinish: (() => void) | undefined;
  const once = jest.fn((event: string, handler: () => void) => {
    if (event === "finish") {
      onFinish = handler;
    }
  });

  return {
    finish: () => {
      if (!onFinish) {
        throw new Error("finish listener was not registered");
      }
      onFinish();
    },
    once,
    response: {
      once,
      statusCode,
    } as unknown as Response,
  };
}

describe("HttpRequestLoggerMiddleware", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    getClientIpMock.mockReset();
  });

  it("emits a structured http_request line with redacted path and requestId", () => {
    const log = jest.spyOn(Logger.prototype, "log").mockImplementation();
    getClientIpMock.mockReturnValue("127.0.0.1");
    const middleware = new HttpRequestLoggerMiddleware(clsStub());
    const { finish, response } = responseStub(200);
    const request = {
      get: (header: string) =>
        header.toLowerCase() === "user-agent" ? "jest" : undefined,
      method: "GET",
      originalUrl: "/api/v1/invitations/preview?token=secret",
      requestId: "req-1",
    } as unknown as Request;

    middleware.use(request, response, () => undefined);
    finish();

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        clientIp: "127.0.0.1",
        method: "GET",
        msg: "http_request",
        path: "/api/v1/invitations/preview?token=[REDACTED]",
        requestId: "req-1",
        statusCode: 200,
        userAgent: "jest",
      })
    );
    expect(
      typeof (log.mock.calls[0]?.[0] as { durationMs: number }).durationMs
    ).toBe("number");
  });

  it("includes CLS orgId and userId on the http_request line", () => {
    const log = jest.spyOn(Logger.prototype, "log").mockImplementation();
    const middleware = new HttpRequestLoggerMiddleware(
      clsStub({ orgId: "org-1", userId: "user-1" })
    );
    const { finish, response } = responseStub(200);
    const request = {
      get: () => undefined,
      method: "GET",
      originalUrl: "/api/v1/projects",
      requestId: "req-2",
    } as unknown as Request;

    middleware.use(request, response, () => undefined);
    finish();

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: "http_request",
        orgId: "org-1",
        requestId: "req-2",
        userId: "user-1",
      })
    );
  });

  it("records HTTP metrics with the route template on finish", () => {
    jest.spyOn(Logger.prototype, "log").mockImplementation();
    const recordHttpRequest = jest
      .spyOn(Metrics, "recordHttpRequest")
      .mockImplementation();
    const middleware = new HttpRequestLoggerMiddleware(clsStub());
    const { finish, response } = responseStub(200);
    const request = {
      baseUrl: "/api/v1/issues",
      get: () => undefined,
      method: "GET",
      originalUrl: "/api/v1/issues/abc",
      path: "/api/v1/issues/abc",
      requestId: "req-3",
      route: { path: "/:id" },
    } as unknown as Request;

    middleware.use(request, response, () => undefined);
    finish();

    expect(recordHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        route: "/api/v1/issues/:id",
        statusCode: 200,
      })
    );
    expect(typeof recordHttpRequest.mock.calls[0]?.[0].durationSeconds).toBe(
      "number"
    );
  });

  it("skips http_request logs and HTTP metrics for probe paths", () => {
    const log = jest.spyOn(Logger.prototype, "log").mockImplementation();
    const recordHttpRequest = jest
      .spyOn(Metrics, "recordHttpRequest")
      .mockImplementation();
    const middleware = new HttpRequestLoggerMiddleware(clsStub());
    const { finish, once, response } = responseStub(200);
    const request = {
      get: () => undefined,
      method: "GET",
      originalUrl: "/metrics",
      path: "/metrics",
      requestId: "req-4",
    } as unknown as Request;

    middleware.use(request, response, () => undefined);
    finish();

    expect(once).toHaveBeenCalledWith("finish", expect.any(Function));
    expect(log).not.toHaveBeenCalled();
    expect(recordHttpRequest).not.toHaveBeenCalled();
  });
});
