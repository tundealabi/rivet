import type { NextFunction, Request, Response } from "express";

import { RequestIdMiddleware } from "./request-id.middleware";

const runWithRequestId = jest.fn((_requestId: string, fn: () => void): void => {
  fn();
});

jest.mock("@/observability", () => ({
  Trace: {
    runWithRequestId: (requestId: string, fn: () => void) =>
      runWithRequestId(requestId, fn),
  },
}));

describe("RequestIdMiddleware", () => {
  afterEach(() => {
    runWithRequestId.mockClear();
  });

  it("reuses x-request-id and binds it for the request", () => {
    const middleware = new RequestIdMiddleware();
    const request = {
      headers: { "x-request-id": "req-from-header" },
    } as unknown as Request;
    const setHeader = jest.fn();
    const response = { setHeader } as unknown as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(request, response, next);

    expect(request.requestId).toBe("req-from-header");
    expect(setHeader).toHaveBeenCalledWith("x-request-id", "req-from-header");
    expect(runWithRequestId).toHaveBeenCalledWith(
      "req-from-header",
      expect.any(Function)
    );
    expect(next).toHaveBeenCalled();
  });

  it("generates a requestId when the header is missing", () => {
    const middleware = new RequestIdMiddleware();
    const request = { headers: {} } as unknown as Request;
    const setHeader = jest.fn();
    const response = { setHeader } as unknown as Response;

    middleware.use(request, response, () => undefined);

    expect(request.requestId).toEqual(
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    );
    expect(setHeader).toHaveBeenCalledWith("x-request-id", request.requestId);
    expect(runWithRequestId).toHaveBeenCalledWith(
      request.requestId,
      expect.any(Function)
    );
  });
});
