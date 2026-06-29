import { ApiResponseState } from "../enums/api.enum.js";
import type {
  ApiGeneralErrorResponseWire,
  ApiGeneralErrorWire,
  ApiPaginatedSuccessResponseWire,
  ApiResponseWire,
  ApiSuccessResponseWire,
  ApiValidationErrorResponseWire,
  ApiValidationErrorWire,
} from "./envelope.wire.js";

export function isApiPaginatedSuccessResponseWire<T>(
  response: ApiResponseWire<T>
): response is ApiPaginatedSuccessResponseWire<T> {
  return (
    response.state === ApiResponseState.SUCCESS &&
    "pagination" in response &&
    response.pagination !== undefined
  );
}

export function isApiSuccessResponseWire<T>(
  response: ApiResponseWire<T>
): response is ApiSuccessResponseWire<T> {
  return (
    response.state === ApiResponseState.SUCCESS &&
    !isApiPaginatedSuccessResponseWire(response)
  );
}

export function isApiGeneralErrorWire(
  error: ApiGeneralErrorWire | ApiValidationErrorWire
): error is ApiGeneralErrorWire {
  return !("fields" in error);
}

export function isApiValidationErrorWire(
  error: ApiGeneralErrorWire | ApiValidationErrorWire
): error is ApiValidationErrorWire {
  return "fields" in error && error.fields !== undefined;
}

export function isApiGeneralErrorResponseWire(
  response: ApiResponseWire<unknown>
): response is ApiGeneralErrorResponseWire {
  return (
    response.state === ApiResponseState.ERROR &&
    response.error !== null &&
    isApiGeneralErrorWire(response.error)
  );
}

export function isApiValidationErrorResponseWire(
  response: ApiResponseWire<unknown>
): response is ApiValidationErrorResponseWire {
  return (
    response.state === ApiResponseState.ERROR &&
    response.error !== null &&
    isApiValidationErrorWire(response.error)
  );
}

export function isApiErrorResponseWire(
  response: ApiResponseWire<unknown>
): response is ApiGeneralErrorResponseWire | ApiValidationErrorResponseWire {
  return response.state === ApiResponseState.ERROR;
}

// Example usage:
// import {
//   type ApiResponseWire,
//   isApiSuccessResponseWire,
//   isApiValidationErrorResponseWire,
// } from "@rivet/shared/api";

// const res: ApiResponseWire<IssueWire> = await fetch(...).then(r => r.json());

// if (isApiSuccessResponseWire(res)) {
//   // res.data is IssueWire
// } else if (isApiValidationErrorResponseWire(res)) {
//   // res.error.fields is defined
// }
