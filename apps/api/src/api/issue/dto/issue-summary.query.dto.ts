import { IssueSummaryQuerySchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class IssueSummaryQueryDto extends createZodDto(
  IssueSummaryQuerySchema
) {}
