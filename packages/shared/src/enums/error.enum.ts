/** Machine-readable error codes aligned with DomainError.code. */
export enum ErrorCode {
  AUTH_EMAIL_ALREADY_EXISTS = "AUTH_EMAIL_ALREADY_EXISTS",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  CONFLICT = "CONFLICT",
  FORBIDDEN = "FORBIDDEN",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  ISSUE_STATUS_CONFLICT = "ISSUE_STATUS_CONFLICT",
  NOT_FOUND = "NOT_FOUND",
  ORG_MEMBER_ALREADY_EXISTS = "ORG_MEMBER_ALREADY_EXISTS",
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
  EMAIL_VERIFICATION_CODE_INVALID = "EMAIL_VERIFICATION_CODE_INVALID",
  EMAIL_VERIFICATION_RESEND_COOLDOWN = "EMAIL_VERIFICATION_RESEND_COOLDOWN",
  VALIDATION_ERROR = "VALIDATION_ERROR",
}

export enum ErrorMessage {
  AUTH_EMAIL_ALREADY_EXISTS = "An account with this email already exists",
  EMAIL_NOT_VERIFIED = "Please verify your email before logging in",
  CONFLICT = "Conflict",
  FORBIDDEN = "Forbidden",
  INTERNAL_SERVER_ERROR = "Something went wrong. Please try again",
  INVALID_CREDENTIALS = "Invalid credentials",
  ISSUE_STATUS_CONFLICT = "Resource changed since you last viewed it",
  NOT_FOUND = "Not found",
  ORG_MEMBER_ALREADY_EXISTS = "An organization member with this user and organization already exists",
  TOO_MANY_REQUESTS = "Too many requests. Please try again later",
  EMAIL_VERIFICATION_CODE_INVALID = "Invalid or expired code.",
  EMAIL_VERIFICATION_RESEND_COOLDOWN = "Please wait before requesting a new code.",
  VALIDATION_ERROR = "Validation errors in your request",
}
