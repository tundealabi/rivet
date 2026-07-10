import { ErrorCode, ErrorMessage } from "@rivet/shared/enums";

import { DomainError } from "./domain.error";

export class ValidationError extends DomainError {
  constructor(public readonly fields: Record<string, { message: string }[]>) {
    super(
      "RULE_VIOLATION",
      ErrorCode.VALIDATION_ERROR,
      ErrorMessage.VALIDATION_ERROR
    );
    this.name = "ValidationError";
  }
}
