import { UpdateProjectRequestSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class UpdateProjectRequestDto extends createZodDto(
  UpdateProjectRequestSchema
) {}
