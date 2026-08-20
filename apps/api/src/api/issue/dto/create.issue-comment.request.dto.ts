import { CreateIssueCommentRequestSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class CreateIssueCommentRequestDto extends createZodDto(
  CreateIssueCommentRequestSchema
) {}
