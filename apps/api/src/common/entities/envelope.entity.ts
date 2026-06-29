import { ApiProperty } from "@nestjs/swagger";
import type {
  ApiErrorFieldWire,
  ApiErrorWire,
  ApiGeneralErrorResponseWire,
  ApiGeneralErrorWire,
  ApiPaginatedSuccessResponseWire,
  ApiPaginationWire,
  ApiResponseWireBase,
  ApiSuccessResponseWire,
  ApiValidationErrorResponseWire,
  ApiValidationErrorWire,
} from "@rivet/shared/api";
import { ApiResponseState } from "@rivet/shared/enums";

export class ApiErrorFieldEntity implements ApiErrorFieldWire {
  @ApiProperty({ type: "string" })
  readonly message!: string;
}

export class ApiGeneralErrorEntity implements ApiGeneralErrorWire {
  @ApiProperty({ type: "string" })
  readonly code!: string;

  @ApiProperty({ type: "string" })
  readonly message!: string;
}

export class ApiValidationErrorEntity implements ApiValidationErrorWire {
  @ApiProperty({ type: "string" })
  readonly code!: string;

  @ApiProperty({ type: "string" })
  readonly message!: string;

  @ApiProperty({
    type: "object",
    additionalProperties: {
      type: "array",
      items: {
        type: "object",
        properties: { message: { type: "string" } },
      },
    },
  })
  readonly fields!: Record<string, ApiErrorFieldWire[]>;
}

export class ApiPaginationEntity implements ApiPaginationWire {
  @ApiProperty({ type: "number" })
  readonly page!: number;

  @ApiProperty({ type: "number" })
  readonly limit!: number;

  @ApiProperty({ type: "number" })
  readonly totalCount!: number;

  @ApiProperty({ type: "number" })
  readonly totalPages!: number;

  @ApiProperty({ type: "string", nullable: true, required: false })
  readonly cursor?: string | null;
}

export class ApiSuccessResponseEntity<
  T = unknown,
> implements ApiSuccessResponseWire<T> {
  @ApiProperty({
    description: "Single resource payload.",
  })
  readonly data!: T;

  @ApiProperty({ enum: ApiResponseState, enumName: "ApiResponseState" })
  readonly state!: ApiResponseState.SUCCESS;

  @ApiProperty({ type: "string", nullable: true, example: null })
  readonly error!: null;

  @ApiProperty({ type: "string" })
  readonly requestId!: string;

  @ApiProperty({ type: "string", example: "2026-02-12T12:00:00.000Z" })
  readonly timestamp!: string;
}

export class ApiPaginatedSuccessResponseEntity<
  T = unknown,
> implements ApiPaginatedSuccessResponseWire<T> {
  @ApiProperty({
    description: "List of resources.",
    isArray: true,
  })
  readonly data!: T[];

  @ApiProperty({ type: () => ApiPaginationEntity })
  readonly pagination!: ApiPaginationWire;

  @ApiProperty({ enum: ApiResponseState, enumName: "ApiResponseState" })
  readonly state!: ApiResponseState.SUCCESS;

  @ApiProperty({ type: "string", nullable: true, example: null })
  readonly error!: null;

  @ApiProperty({ type: "string" })
  readonly requestId!: string;

  @ApiProperty({ type: "string", example: "2026-02-12T12:00:00.000Z" })
  readonly timestamp!: string;
}

export class ApiGeneralErrorResponseEntity implements ApiGeneralErrorResponseWire {
  @ApiProperty({ type: "string", nullable: true, example: null })
  readonly data!: null;

  @ApiProperty({ type: () => ApiGeneralErrorEntity })
  readonly error!: ApiGeneralErrorWire;

  @ApiProperty({ enum: ApiResponseState, enumName: "ApiResponseState" })
  readonly state!: ApiResponseState.ERROR;

  @ApiProperty({ type: "string" })
  readonly requestId!: string;

  @ApiProperty({ type: "string", example: "2026-02-12T12:00:00.000Z" })
  readonly timestamp!: string;
}

export class ApiValidationErrorResponseEntity implements ApiValidationErrorResponseWire {
  @ApiProperty({ type: "string", nullable: true, example: null })
  readonly data!: null;

  @ApiProperty({ type: () => ApiValidationErrorEntity })
  readonly error!: ApiValidationErrorWire;

  @ApiProperty({ enum: ApiResponseState, enumName: "ApiResponseState" })
  readonly state!: ApiResponseState.ERROR;

  @ApiProperty({ type: "string" })
  readonly requestId!: string;

  @ApiProperty({ type: "string", example: "2026-02-12T12:00:00.000Z" })
  readonly timestamp!: string;
}

/** Generic envelope for Swagger — union of all response variants. */
export class ApiResponseEntity<T = unknown> implements ApiResponseWireBase<T> {
  @ApiProperty({
    description: "Response payload. Object or array on success; null on error.",
    nullable: true,
  })
  readonly data!: T | T[] | null;

  @ApiProperty({ type: () => ApiPaginationEntity, required: false })
  readonly pagination?: ApiPaginationWire;

  @ApiProperty({
    oneOf: [
      { $ref: "#/components/schemas/ApiGeneralErrorEntity" },
      { $ref: "#/components/schemas/ApiValidationErrorEntity" },
    ],
    nullable: true,
  })
  readonly error!: ApiErrorWire | null;

  @ApiProperty({ enum: ApiResponseState, enumName: "ApiResponseState" })
  readonly state!: ApiResponseState;

  @ApiProperty({ type: "string" })
  readonly requestId!: string;

  @ApiProperty({ type: "string", example: "2026-02-12T12:00:00.000Z" })
  readonly timestamp!: string;
}
