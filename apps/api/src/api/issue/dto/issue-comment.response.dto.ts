import { IssueCommentResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class IssueCommentResponseDto extends createZodDto(
  IssueCommentResponseSchema
) {}
