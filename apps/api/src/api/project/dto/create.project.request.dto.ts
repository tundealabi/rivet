import { CreateProjectRequestSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class CreateProjectRequestDto extends createZodDto(
  CreateProjectRequestSchema
) {}
