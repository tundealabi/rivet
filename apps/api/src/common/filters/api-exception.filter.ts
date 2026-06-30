import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type {
  ApiGeneralErrorResponseWire,
  ApiValidationErrorResponseWire,
} from "@rivet/shared/api";
import { flattenZodErrorToFields } from "@rivet/shared/api";
import { ApiResponseState, ErrorCode, ErrorMessage } from "@rivet/shared/enums";
import { Request, Response } from "express";
import { ZodValidationException } from "nestjs-zod";

import { DomainError } from "@/common/errors";

const SENSITIVE_REQUEST_FIELDS = ["idToken", "password"] as const;

function redactSensitiveFields(
  body: Record<string, unknown>
): Record<string, unknown> {
  if (!body || typeof body !== "object") {
    return body;
  }

  const redacted = { ...body };

  for (const field of SENSITIVE_REQUEST_FIELDS) {
    if (redacted[field]) {
      redacted[field] = "[REDACTED]";
    }
  }

  return redacted;
}

function buildRequestLog(request: Request) {
  return {
    body: redactSensitiveFields(request.body as Record<string, unknown>),
    method: request.method,
    params: request.params,
    query: request.query,
    requestId: request.requestId,
    timestamp: new Date().toISOString(),
    url: request.originalUrl,
  };
}

function buildValidationErrorBody(
  requestId: string,
  timestamp: string,
  fields: Record<string, { message: string }[]>
): ApiValidationErrorResponseWire {
  return {
    data: null,
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      message: ErrorMessage.VALIDATION_ERROR,
      fields,
    },
    state: ApiResponseState.ERROR,
    requestId,
    timestamp,
  };
}

function extractExceptionCode(response: unknown): string | undefined {
  if (typeof response === "object" && response !== null && "code" in response) {
    const code = response.code;

    if (typeof code === "string" && code.length > 0) {
      return code;
    }
  }

  return undefined;
}

function resolveErrorMessage(code: string, fallback: string): string {
  if (Object.values(ErrorCode).includes(code as ErrorCode)) {
    return ErrorMessage[code as ErrorCode];
  }

  return fallback;
}

function resolveErrorCode(
  status: HttpStatus,
  response: unknown,
  mapStatusToCode: (status: HttpStatus) => ErrorCode
): string {
  return extractExceptionCode(response) ?? mapStatusToCode(status);
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const timestamp = new Date().toISOString();
    const requestId = request.requestId ?? "unknown";
    const requestLog = buildRequestLog(request);

    if (exception instanceof DomainError) {
      const status = this.mapDomainErrorStatus(exception.kind);
      const body: ApiGeneralErrorResponseWire = {
        data: null,
        error: {
          code: exception.code,
          message: exception.message,
        },
        state: ApiResponseState.ERROR,
        requestId,
        timestamp,
      };

      this.logger.error(
        {
          errorMessage: exception.message,
          errorCode: exception.code,
          errorStatus: status,
          request: requestLog,
        },
        `${ApiExceptionFilter.name}@DomainError:${status}`
      );

      response.status(status).json(body);
      return;
    }

    if (exception instanceof ZodValidationException) {
      const fields = flattenZodErrorToFields(exception.getZodError());
      const body = buildValidationErrorBody(requestId, timestamp, fields);

      this.logger.error(
        {
          errorMessage: ErrorMessage.VALIDATION_ERROR,
          errorCode: ErrorCode.VALIDATION_ERROR,
          errorResponse: fields,
          errorStatus: HttpStatus.BAD_REQUEST,
          request: requestLog,
        },
        `${ApiExceptionFilter.name}@ValidationException:${HttpStatus.BAD_REQUEST}`
      );

      response.status(HttpStatus.BAD_REQUEST).json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const message = this.extractExceptionMessage(
        exception,
        exceptionResponse
      );
      const code = resolveErrorCode(status, exceptionResponse, (httpStatus) =>
        this.mapHttpStatusToErrorCode(httpStatus)
      );
      const body: ApiGeneralErrorResponseWire = {
        data: null,
        error: {
          code,
          message: resolveErrorMessage(code, message),
        },
        state: ApiResponseState.ERROR,
        requestId,
        timestamp,
      };

      this.logger.error(
        {
          errorMessage: message,
          errorCode: code,
          errorStatus: status,
          request: requestLog,
        },
        `${ApiExceptionFilter.name}@HttpException:${status}`
      );

      response.status(status).json(body);
      return;
    }

    const applicationError =
      exception instanceof Error ? exception : new Error(String(exception));

    this.logger.error(
      {
        errorMessage: applicationError.message,
        errorStack: applicationError.stack,
        errorStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        request: requestLog,
      },
      `${ApiExceptionFilter.name}@ApplicationError:${HttpStatus.INTERNAL_SERVER_ERROR}`
    );

    const body: ApiGeneralErrorResponseWire = {
      data: null,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: ErrorMessage.INTERNAL_SERVER_ERROR,
      },
      state: ApiResponseState.ERROR,
      requestId,
      timestamp,
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }

  private extractExceptionMessage(
    exception: HttpException,
    response: string | object
  ): string {
    if (typeof response === "string") {
      return response;
    }

    if (
      typeof response === "object" &&
      response !== null &&
      "message" in response
    ) {
      const message = response.message;

      if (typeof message === "string") {
        return message;
      }

      if (
        Array.isArray(message) &&
        message.every((item) => typeof item === "string")
      ) {
        return message.join(", ");
      }
    }

    return exception.message;
  }

  private mapDomainErrorStatus(kind: DomainError["kind"]): HttpStatus {
    switch (kind) {
      case "NOT_FOUND":
        return HttpStatus.NOT_FOUND;
      case "CONFLICT":
        return HttpStatus.CONFLICT;
      case "RULE_VIOLATION":
        return HttpStatus.UNPROCESSABLE_ENTITY;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }

  private mapHttpStatusToErrorCode(status: HttpStatus): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.INVALID_CREDENTIALS;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.CONFLICT;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}
