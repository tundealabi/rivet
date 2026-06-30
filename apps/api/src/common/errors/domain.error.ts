import { DomainErrorKind } from "@/common/types";

export class DomainError extends Error {
  constructor(
    public readonly kind: DomainErrorKind,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "DomainError";
  }
}
