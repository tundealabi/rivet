import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

import type { Request } from "express";
import type { ClsService } from "nestjs-cls";
import type { Options } from "pino-http";

import type { TenantContextStore } from "@/common/constants";
import { NodeEnv } from "@/common/enums";
import { Trace } from "@/observability";

import { SENSITIVE_REQUEST_FIELDS } from "./redact-request";
import { tenantFieldsFromCls } from "./tenant-log-fields";

function isJestWorker(): boolean {
  return process.env.JEST_WORKER_ID !== undefined;
}

function shouldPrettyPrint(): boolean {
  return process.env.NODE_ENV !== NodeEnv.PRODUCTION && !isJestWorker();
}

function requestIdFromReq(req: IncomingMessage): string {
  const expressReq = req as Request;

  if (
    typeof expressReq.requestId === "string" &&
    expressReq.requestId.length > 0
  ) {
    return expressReq.requestId;
  }

  const header = req.headers["x-request-id"];

  if (typeof header === "string" && header.length > 0) {
    return header;
  }

  return randomUUID();
}

export function createPinoHttpOptions(
  cls: ClsService<TenantContextStore>
): Options {
  return {
    autoLogging: false,
    customAttributeKeys: {
      reqId: "requestId",
    },
    genReqId: (req: IncomingMessage, _res: ServerResponse) =>
      requestIdFromReq(req),
    level: isJestWorker() ? "silent" : "info",
    mixin: () => {
      const requestId = Trace.requestId();

      return {
        ...tenantFieldsFromCls(cls),
        ...(requestId ? { requestId } : {}),
      };
    },
    quietReqLogger: true,
    redact: {
      censor: "[REDACTED]",
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        'req.headers["stripe-signature"]',
        ...SENSITIVE_REQUEST_FIELDS.flatMap((field) => [
          `req.body.${field}`,
          `req.query.${field}`,
        ]),
      ],
    },
    ...(shouldPrettyPrint()
      ? {
          transport: {
            options: {
              colorize: true,
              ignore: "pid,hostname",
              singleLine: true,
              translateTime: "SYS:standard",
            },
            target: "pino-pretty",
          },
        }
      : {}),
  };
}
