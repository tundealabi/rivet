import {
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_KEY_MAX_LENGTH,
} from "@rivet/shared/constants";

import { ValidationError } from "@/common/errors";

export function parseIdempotencyKey(value: string | undefined): string {
  const key = value?.trim();

  if (!key) {
    throw new ValidationError({
      [IDEMPOTENCY_KEY_HEADER]: [
        { message: "Idempotency-Key header is required" },
      ],
    });
  }

  if (key.length > IDEMPOTENCY_KEY_MAX_LENGTH) {
    throw new ValidationError({
      [IDEMPOTENCY_KEY_HEADER]: [{ message: "Idempotency-Key is too long" }],
    });
  }

  return key;
}
