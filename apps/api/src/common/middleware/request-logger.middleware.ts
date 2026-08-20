import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { ClsService } from "nestjs-cls";
import { getClientIp } from "request-ip";

import {
  isUnprefixedProbePath,
  LOG_MSG,
  type TenantContextStore,
} from "@/common/constants";
import { Helpers } from "@/common/helpers";
import { Metrics } from "@/observability";

@Injectable()
export class HttpRequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpRequestLoggerMiddleware.name);

  constructor(private readonly cls: ClsService<TenantContextStore>) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const startTime = performance.now();
    const { method, originalUrl, requestId } = request;
    const userAgent = request.get("user-agent") || "";

    response.once("finish", () => {
      if (isUnprefixedProbePath(request.path ?? originalUrl)) {
        return;
      }

      const durationMs = Number((performance.now() - startTime).toFixed(2));

      this.logger.log({
        clientIp: getClientIp(request),
        durationMs,
        method,
        msg: LOG_MSG.httpRequest,
        path: Helpers.redactSensitiveUrl(originalUrl),
        requestId,
        statusCode: response.statusCode,
        userAgent,
        ...Helpers.resolveTenantLogFields(this.cls, request),
      });

      Metrics.recordHttpRequest({
        durationSeconds: durationMs / 1000,
        method,
        route: Helpers.httpRouteTemplate(request),
        statusCode: response.statusCode,
      });
    });

    next();
  }
}
