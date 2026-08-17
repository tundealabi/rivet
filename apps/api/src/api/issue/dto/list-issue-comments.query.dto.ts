import { ListIssueCommentsQuerySchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class ListIssueCommentsQueryDto extends createZodDto(
  ListIssueCommentsQuerySchema
) {}
