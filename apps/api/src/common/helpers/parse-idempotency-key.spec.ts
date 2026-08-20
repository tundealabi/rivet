import {
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_KEY_MAX_LENGTH,
} from "@rivet/shared/constants";

import { ValidationError } from "@/common/errors";

import { parseIdempotencyKey } from "./parse-idempotency-key";

describe("parseIdempotencyKey", () => {
  it("rejects a missing or blank header", () => {
    expect(() => parseIdempotencyKey(undefined)).toThrow(ValidationError);
    expect(() => parseIdempotencyKey("  ")).toThrow(ValidationError);

    try {
      parseIdempotencyKey(undefined);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fields[IDEMPOTENCY_KEY_HEADER]).toEqual(
        [{ message: "Idempotency-Key header is required" }]
      );
    }
  });

  it("rejects a key longer than the max length", () => {
    expect(() =>
      parseIdempotencyKey("a".repeat(IDEMPOTENCY_KEY_MAX_LENGTH + 1))
    ).toThrow(ValidationError);
  });

  it("trims a valid key", () => {
    expect(parseIdempotencyKey("  abc  ")).toBe("abc");
  });
});
