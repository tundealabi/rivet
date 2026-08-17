import { UpdateIssueCommentRequestSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class UpdateIssueCommentRequestDto extends createZodDto(
  UpdateIssueCommentRequestSchema
) {}
