import type { CreateExportRequestWire } from "@rivet/shared/api";

export type CreateExportInput = CreateExportRequestWire & {
  idempotencyKey: string | undefined;
};
