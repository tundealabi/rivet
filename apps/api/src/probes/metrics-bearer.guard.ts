import { createHash, timingSafeEqual } from "node:crypto";

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

export function readMetricsBearerToken(): string | undefined {
  const raw = process.env.OTEL_METRICS_BEARER_TOKEN?.trim();

  return raw && raw.length > 0 ? raw : undefined;
}

export function authorizationMatchesBearer(
  authorizationHeader: string | string[] | undefined,
  expected: string
): boolean {
  const presented = presentedBearer(authorizationHeader);

  if (presented === undefined) {
    return false;
  }

  const presentedDigest = createHash("sha256").update(presented).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();

  return timingSafeEqual(presentedDigest, expectedDigest);
}

@Injectable()
export class MetricsBearerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = readMetricsBearerToken();

    if (expected === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (!authorizationMatchesBearer(request.headers.authorization, expected)) {
      throw new UnauthorizedException();
    }

    return true;
  }
}

function presentedBearer(
  authorizationHeader: string | string[] | undefined
): string | undefined {
  const value = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader;

  if (typeof value !== "string") {
    return undefined;
  }

  const match = /^Bearer\s+(\S+)$/i.exec(value.trim());

  return match?.[1];
}
