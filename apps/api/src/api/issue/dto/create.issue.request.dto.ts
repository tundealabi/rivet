import { CreateIssueRequestSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class CreateIssueRequestDto extends createZodDto(
  CreateIssueRequestSchema
) {}
