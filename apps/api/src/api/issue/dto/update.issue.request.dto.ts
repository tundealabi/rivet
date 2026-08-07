import { UpdateIssueRequestSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class UpdateIssueRequestDto extends createZodDto(
  UpdateIssueRequestSchema
) {}
