import { CreateExportRequestSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class CreateExportRequestDto extends createZodDto(
  CreateExportRequestSchema
) {}
