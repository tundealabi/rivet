import type { ApiResponseState } from "../enums/api.enum.js";

export interface ApiErrorFieldWire {
  message: string;
}

export interface ApiGeneralErrorWire {
  code: string;
  message: string;
}

export interface ApiValidationErrorWire {
  code: string;
  message: string;
  fields: Record<string, ApiErrorFieldWire[]>;
}

export type ApiErrorWire = ApiGeneralErrorWire | ApiValidationErrorWire;

export interface ApiPaginationWire {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  cursor?: string | null;
}

export interface ApiEnvelopeBase {
  requestId: string;
  timestamp: string;
}

/** Success — single resource */
export interface ApiSuccessResponseWire<T> extends ApiEnvelopeBase {
  data: T;
  error: null;
  state: ApiResponseState.SUCCESS;
  pagination?: never;
}

/** Success — paginated list */
export interface ApiPaginatedSuccessResponseWire<T> extends ApiEnvelopeBase {
  data: T[];
  pagination: ApiPaginationWire;
  error: null;
  state: ApiResponseState.SUCCESS;
}

/** Error — general (no field map) */
export interface ApiGeneralErrorResponseWire extends ApiEnvelopeBase {
  data: null;
  error: ApiGeneralErrorWire;
  state: ApiResponseState.ERROR;
  pagination?: never;
}

/** Error — validation (field map present) */
export interface ApiValidationErrorResponseWire extends ApiEnvelopeBase {
  data: null;
  error: ApiValidationErrorWire;
  state: ApiResponseState.ERROR;
  pagination?: never;
}

export type ApiResponseWire<T> =
  | ApiSuccessResponseWire<T>
  | ApiPaginatedSuccessResponseWire<T>
  | ApiGeneralErrorResponseWire
  | ApiValidationErrorResponseWire;

/** Wide envelope shape */
export interface ApiResponseWireBase<T = unknown> {
  data: T | T[] | null;
  pagination?: ApiPaginationWire;
  error: ApiErrorWire | null;
  state: ApiResponseState;
  requestId: string;
  timestamp: string;
}
