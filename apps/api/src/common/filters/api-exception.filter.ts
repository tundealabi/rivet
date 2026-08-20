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

import { isUnprefixedProbePath, LOG_MSG } from "@/common/constants";
import { DomainError, ValidationError } from "@/common/errors";
import { Helpers } from "@/common/helpers";

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
    return ErrorMessage[code as keyof typeof ErrorMessage] ?? fallback;
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
    const requestLog = Helpers.buildRequestErrorLog(request);

    if (isUnprefixedProbePath(request.path ?? request.originalUrl)) {
      if (exception instanceof HttpException) {
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        response
          .status(status)
          .json(
            typeof exceptionResponse === "string"
              ? { message: exceptionResponse, status: "error" }
              : exceptionResponse
          );
        return;
      }
    }

    if (exception instanceof ValidationError) {
      const fields = exception.fields;
      const body = buildValidationErrorBody(requestId, timestamp, fields);

      this.logger.error({
        errorCode: ErrorCode.VALIDATION_ERROR,
        errorMessage: ErrorMessage.VALIDATION_ERROR,
        errorResponse: fields,
        errorStatus: HttpStatus.BAD_REQUEST,
        msg: LOG_MSG.validationError,
        request: requestLog,
      });

      response.status(HttpStatus.BAD_REQUEST).json(body);
      return;
    }

    if (exception instanceof DomainError) {
      const status = this.mapDomainErrorStatus(exception.kind);
      const body: ApiGeneralErrorResponseWire = {
        data: null,
        error: {
          code: exception.code,
          message: exception.message,
          ...(exception.details !== undefined
            ? { details: exception.details }
            : {}),
        },
        state: ApiResponseState.ERROR,
        requestId,
        timestamp,
      };

      this.logger.error({
        errorCode: exception.code,
        errorMessage: exception.message,
        errorStatus: status,
        msg: LOG_MSG.domainError,
        request: requestLog,
      });

      response.status(status).json(body);
      return;
    }

    if (exception instanceof ZodValidationException) {
      const fields = flattenZodErrorToFields(exception.getZodError());
      const body = buildValidationErrorBody(requestId, timestamp, fields);

      this.logger.error({
        errorCode: ErrorCode.VALIDATION_ERROR,
        errorMessage: ErrorMessage.VALIDATION_ERROR,
        errorResponse: fields,
        errorStatus: HttpStatus.BAD_REQUEST,
        msg: LOG_MSG.validationError,
        request: requestLog,
      });

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

      this.logger.error({
        errorCode: code,
        errorMessage: message,
        errorStatus: status,
        msg: LOG_MSG.httpException,
        request: requestLog,
      });

      response.status(status).json(body);
      return;
    }

    const applicationError =
      exception instanceof Error ? exception : new Error(String(exception));

    this.logger.error({
      err: applicationError,
      errorStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      msg: LOG_MSG.unhandledException,
      request: requestLog,
    });

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
      case "INVALID_CREDENTIALS":
        return HttpStatus.UNAUTHORIZED;
      case "FORBIDDEN":
        return HttpStatus.FORBIDDEN;
      case "NOT_FOUND":
        return HttpStatus.NOT_FOUND;
      case "CONFLICT":
        return HttpStatus.CONFLICT;
      case "RULE_VIOLATION":
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case "TOO_MANY_REQUESTS":
        return HttpStatus.TOO_MANY_REQUESTS;
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
        return ErrorCode.TOO_MANY_REQUESTS;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}
