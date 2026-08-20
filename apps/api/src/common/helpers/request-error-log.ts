import type { Request } from "express";

import { redactSensitiveFields, redactSensitiveUrl } from "./redact-request";

function isStripeWebhookUrl(url: string): boolean {
  return url.split("?")[0].endsWith("/webhooks/stripe");
}

export function buildRequestErrorLog(request: Request): {
  body?: unknown;
  method: string;
  params: unknown;
  query: unknown;
  requestId: string;
  timestamp: string;
  url: string;
} {
  const url = redactSensitiveUrl(request.originalUrl);
  const stripeWebhook = isStripeWebhookUrl(request.path ?? request.originalUrl);

  return {
    method: request.method,
    params: request.params,
    query: redactSensitiveFields(request.query),
    requestId: request.requestId,
    timestamp: new Date().toISOString(),
    url,
    ...(stripeWebhook
      ? {}
      : {
          body: redactSensitiveFields(
            request.body as Record<string, unknown> | undefined
          ),
        }),
  };
}
