import { ProjectDetailResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class ProjectDetailResponseDto extends createZodDto(
  ProjectDetailResponseSchema
) {}
