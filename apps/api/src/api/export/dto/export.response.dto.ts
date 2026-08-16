import { ExportJobResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class ExportJobResponseDto extends createZodDto(
  ExportJobResponseSchema
) {}
