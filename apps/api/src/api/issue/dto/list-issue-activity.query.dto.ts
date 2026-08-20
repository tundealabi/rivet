import { ListIssueActivityQuerySchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class ListIssueActivityQueryDto extends createZodDto(
  ListIssueActivityQuerySchema
) {}
