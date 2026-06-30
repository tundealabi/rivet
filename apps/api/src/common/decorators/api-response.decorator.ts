import { applyDecorators, HttpCode, HttpStatus, Type } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponseOptions,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { type ZodDto, ZodSerializerDto } from "nestjs-zod";

import {
  ApiGeneralErrorResponseEntity,
  ApiPaginatedSuccessResponseEntity,
  ApiSuccessResponseEntity,
  ApiValidationErrorResponseEntity,
} from "@/common/entities";

type ZodDtoClass = ZodDto & Type<unknown>;

const isZodDtoClass = (model: Type<unknown>): model is ZodDtoClass =>
  "isZodDto" in model && model.isZodDto === true;

type SwaggerSchema = Record<string, unknown>;

const buildSuccessResponseSchema = (
  model: Type<unknown> | null,
  isArray?: boolean
): SwaggerSchema => {
  const envelope = isArray
    ? ApiPaginatedSuccessResponseEntity
    : ApiSuccessResponseEntity;

  const dataSchema = isArray
    ? {
        type: "array" as const,
        items: model ? { $ref: getSchemaPath(model) } : {},
      }
    : model
      ? { $ref: getSchemaPath(model) }
      : { nullable: true, example: null };

  return {
    allOf: [
      { $ref: getSchemaPath(envelope) },
      { properties: { data: dataSchema } },
    ],
  };
};

const buildGeneralErrorResponseSchema = (
  message: string,
  code?: string
): SwaggerSchema => ({
  allOf: [
    { $ref: getSchemaPath(ApiGeneralErrorResponseEntity) },
    {
      properties: {
        error: {
          type: "object",
          properties: {
            message: { type: "string", example: message },
            ...(code ? { code: { type: "string", example: code } } : {}),
          },
        },
      },
    },
  ],
});

const buildValidationErrorResponseSchema = (
  message: string
): SwaggerSchema => ({
  allOf: [
    { $ref: getSchemaPath(ApiValidationErrorResponseEntity) },
    {
      properties: {
        error: {
          type: "object",
          properties: {
            message: { type: "string", example: message },
            code: { type: "string", example: "VALIDATION_ERROR" },
            fields: {
              type: "object",
              example: {
                email: [{ message: "email must be an email" }],
              },
            },
          },
        },
      },
    },
  ],
});

const ERROR_STATUS_CONFIG: Record<
  number,
  {
    defaultDescription: string;
    defaultMessage: string;
    defaultCode?: string;
    decorator: (
      options: ApiResponseOptions
    ) => MethodDecorator & ClassDecorator;
    isValidation?: boolean;
  }
> = {
  [HttpStatus.BAD_REQUEST]: {
    defaultDescription: "Validation errors in your request",
    defaultMessage: "Validation errors in your request",
    defaultCode: "VALIDATION_ERROR",
    decorator: ApiBadRequestResponse,
    isValidation: true,
  },
  [HttpStatus.UNAUTHORIZED]: {
    defaultDescription: "Missing or invalid authentication token",
    defaultMessage: "Unauthorized",
    defaultCode: "INVALID_CREDENTIALS",
    decorator: ApiUnauthorizedResponse,
  },
  [HttpStatus.FORBIDDEN]: {
    defaultDescription: "Insufficient permissions to access this resource",
    defaultMessage: "Forbidden",
    defaultCode: "FORBIDDEN",
    decorator: ApiForbiddenResponse,
  },
  [HttpStatus.NOT_FOUND]: {
    defaultDescription: "The requested resource was not found",
    defaultMessage: "Not found",
    defaultCode: "NOT_FOUND",
    decorator: ApiNotFoundResponse,
  },
  [HttpStatus.CONFLICT]: {
    defaultDescription: "The request conflicts with existing data",
    defaultMessage: "Conflict",
    defaultCode: "CONFLICT",
    decorator: ApiConflictResponse,
  },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    defaultDescription: "Rate limit exceeded. Please try again later",
    defaultMessage: "Too many requests",
    defaultCode: "TOO_MANY_REQUESTS",
    decorator: ApiTooManyRequestsResponse,
  },
  [HttpStatus.INTERNAL_SERVER_ERROR]: {
    defaultDescription: "An unexpected error occurred on the server",
    defaultMessage: "Something went wrong. Please try again.",
    defaultCode: "INTERNAL_SERVER_ERROR",
    decorator: ApiInternalServerErrorResponse,
  },
};

type ErrorResponse = HttpStatus | { status: HttpStatus; description: string };

type ApiResponseAuth = "optional" | "public" | "required";

const OPTIONAL_AUTH_OPERATION_DESCRIPTION =
  "Optional Bearer token: when provided, user-specific fields are included in the response. Invalid or expired tokens return 401.";

/**
 * Documents API envelope response in Swagger — success, pagination, and common errors.
 *
 * @example
 * @ApiEnvelopeResponse(IssueEntity, {
 *   summary: "Get issue",
 *   description: "Returns a single issue by id",
 *   httpStatus: HttpStatus.OK,
 *   errorResponses: [HttpStatus.NOT_FOUND],
 * })
 */
export const ApiEnvelopeResponse = <TModel extends Type<unknown>>(
  model: TModel | null,
  options: ApiResponseOptions & {
    auth?: ApiResponseAuth;
    description: string;
    httpStatus: HttpStatus.CREATED | HttpStatus.OK | HttpStatus.NO_CONTENT;
    isArray?: boolean;
    summary: string;
    errorResponses?: ErrorResponse[];
  }
) => {
  const {
    auth: authMode = "required",
    httpStatus,
    isArray,
    summary,
    errorResponses = [],
    ...rest
  } = options;

  const decorators: (MethodDecorator | ClassDecorator)[] = [
    ApiExtraModels(
      ApiSuccessResponseEntity,
      ApiPaginatedSuccessResponseEntity,
      ApiGeneralErrorResponseEntity,
      ApiValidationErrorResponseEntity
    ),
  ];

  if (model) {
    decorators.push(ApiExtraModels(model));

    if (isZodDtoClass(model)) {
      decorators.push(
        isArray ? ZodSerializerDto([model]) : ZodSerializerDto(model)
      );
    }
  }

  decorators.push(
    ApiOperation({
      summary,
      ...(authMode === "optional" && {
        description: OPTIONAL_AUTH_OPERATION_DESCRIPTION,
      }),
    })
  );

  if (authMode === "optional" || authMode === "required") {
    decorators.push(ApiBearerAuth());
  }

  switch (httpStatus) {
    case HttpStatus.CREATED:
      decorators.push(
        ApiCreatedResponse({
          ...rest,
          schema: buildSuccessResponseSchema(model),
        }),
        HttpCode(HttpStatus.CREATED)
      );
      break;
    case HttpStatus.NO_CONTENT:
      decorators.push(
        ApiNoContentResponse({ ...rest }),
        HttpCode(HttpStatus.NO_CONTENT)
      );
      break;
    default:
      decorators.push(
        ApiOkResponse({
          ...rest,
          schema: buildSuccessResponseSchema(model, isArray),
        }),
        HttpCode(HttpStatus.OK)
      );
  }

  const errorStatuses = new Set<HttpStatus>([
    HttpStatus.BAD_REQUEST,
    HttpStatus.TOO_MANY_REQUESTS,
    HttpStatus.INTERNAL_SERVER_ERROR,
  ]);

  const customDescriptions = new Map<HttpStatus, string>();

  if (authMode === "required" || authMode === "optional") {
    errorStatuses.add(HttpStatus.UNAUTHORIZED);
  }

  if (authMode === "optional") {
    customDescriptions.set(
      HttpStatus.UNAUTHORIZED,
      "Invalid or expired authentication token"
    );
  }

  for (const err of errorResponses) {
    if (typeof err === "number") {
      errorStatuses.add(err);
    } else {
      errorStatuses.add(err.status);
      customDescriptions.set(err.status, err.description);
    }
  }

  for (const status of errorStatuses) {
    const config = ERROR_STATUS_CONFIG[status];
    if (!config) continue;

    const description =
      customDescriptions.get(status) ?? config.defaultDescription;
    const message = customDescriptions.get(status) ?? config.defaultMessage;

    decorators.push(
      config.decorator({
        description,
        schema: config.isValidation
          ? buildValidationErrorResponseSchema(message)
          : buildGeneralErrorResponseSchema(message, config.defaultCode),
      })
    );
  }

  return applyDecorators(...decorators);
};
