import { ListProjectsQuerySchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class ListProjectsQueryDto extends createZodDto(
  ListProjectsQuerySchema
) {}
