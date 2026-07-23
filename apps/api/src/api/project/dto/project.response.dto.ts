import { ProjectResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class ProjectResponseDto extends createZodDto(ProjectResponseSchema) {}
