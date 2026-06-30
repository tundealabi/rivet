import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type {
  ApiPaginatedSuccessResponseWire,
  ApiResponseWire,
  ApiSuccessResponseWire,
} from "@rivet/shared/api";
import { ApiResponseState } from "@rivet/shared/enums";
import { Request } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { isPaginatedResult } from "@/common/types";

function isEnvelopedResponse(
  value: unknown
): value is ApiResponseWire<unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    "state" in candidate &&
    "requestId" in candidate &&
    "timestamp" in candidate &&
    "error" in candidate
  );
}

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpStatus =
      this.reflector.get<HttpStatus>("httpCode", context.getHandler()) ??
      HttpStatus.OK;

    if (httpStatus === HttpStatus.NO_CONTENT) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((body: unknown) => {
        if (isEnvelopedResponse(body)) {
          return body;
        }

        const timestamp = new Date().toISOString();
        const requestId = request.requestId;

        if (isPaginatedResult(body)) {
          const response: ApiPaginatedSuccessResponseWire<unknown> = {
            data: body.items,
            error: null,
            pagination: body.pagination,
            requestId,
            state: ApiResponseState.SUCCESS,
            timestamp,
          };
          return response;
        }

        const response: ApiSuccessResponseWire<unknown> = {
          data: body,
          error: null,
          requestId,
          state: ApiResponseState.SUCCESS,
          timestamp,
        };
        return response;
      })
    );
  }
}
