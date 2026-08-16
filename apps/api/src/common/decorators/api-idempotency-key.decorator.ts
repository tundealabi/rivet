import { applyDecorators } from "@nestjs/common";
import { ApiHeader } from "@nestjs/swagger";
import { IDEMPOTENCY_KEY_HEADER } from "@rivet/shared/constants";

export const ApiIdempotencyKeyHeader = () =>
  applyDecorators(
    ApiHeader({
      description: "Client-generated key to dedupe create requests",
      name: IDEMPOTENCY_KEY_HEADER,
      required: true,
    })
  );
