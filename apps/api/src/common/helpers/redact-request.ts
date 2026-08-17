const SENSITIVE_REQUEST_FIELDS = [
  "idToken",
  "password",
  "refreshToken",
  "token",
] as const;

const REDACTED = "[REDACTED]";

function redactSensitiveFields<T>(value: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const redacted: Record<string, unknown> = {
    ...(value as Record<string, unknown>),
  };

  for (const field of SENSITIVE_REQUEST_FIELDS) {
    if (
      field in redacted &&
      redacted[field] != null &&
      redacted[field] !== ""
    ) {
      redacted[field] = REDACTED;
    }
  }

  return redacted as T;
}

function redactSensitiveUrl(url: string): string {
  return url.replace(/([?&]token=)[^&]*/gi, `$1${REDACTED}`);
}

export { redactSensitiveFields, redactSensitiveUrl, SENSITIVE_REQUEST_FIELDS };
