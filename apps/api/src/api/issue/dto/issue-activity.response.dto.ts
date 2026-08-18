import { IssueActivityResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class IssueActivityResponseDto extends createZodDto(
  IssueActivityResponseSchema
) {}
