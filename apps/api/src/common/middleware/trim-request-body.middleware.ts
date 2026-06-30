import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class TrimRequestBodyMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const body = request.body as Record<string, unknown> | undefined;
    if (body && typeof body === "object") {
      for (const key of Object.keys(body)) {
        const value = body[key];
        if (typeof value === "string") {
          body[key] = value.trim();
        }
      }
    }
    next();
  }
}
