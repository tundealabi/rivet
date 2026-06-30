import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { getClientIp } from "request-ip";

@Injectable()
export class HttpRequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpRequestLoggerMiddleware.name);
  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, requestId } = request;
    const userAgent = request.get("user-agent") || "";
    response.on("finish", () => {
      const { statusCode } = response;
      const contentLength = response.get("content-length");
      const clientIp = getClientIp(request);
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${clientIp} ${requestId}`,
        "HTTPRequest"
      );
    });
    next();
  }
}
