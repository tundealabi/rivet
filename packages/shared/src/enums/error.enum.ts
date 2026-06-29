/** Machine-readable error codes aligned with DomainError.code. */
export enum ErrorCode {
  AUTH_EMAIL_ALREADY_EXISTS = "AUTH_EMAIL_ALREADY_EXISTS",
  CONFLICT = "CONFLICT",
  FORBIDDEN = "FORBIDDEN",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  ISSUE_STATUS_CONFLICT = "ISSUE_STATUS_CONFLICT",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

export enum ErrorMessage {
  AUTH_EMAIL_ALREADY_EXISTS = "An account with this email already exists",
  CONFLICT = "Conflict",
  FORBIDDEN = "Forbidden",
  INTERNAL_SERVER_ERROR = "Something went wrong. Please try again.",
  INVALID_CREDENTIALS = "Invalid credentials",
  ISSUE_STATUS_CONFLICT = "Resource changed since you last viewed it",
  NOT_FOUND = "Not found",
  VALIDATION_ERROR = "Validation errors in your request",
}
