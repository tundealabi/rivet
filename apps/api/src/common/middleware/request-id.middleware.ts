import { randomUUID } from "node:crypto";

import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers["x-request-id"];
    const requestId =
      typeof header === "string" && header.length > 0 ? header : randomUUID();

    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  }
}
