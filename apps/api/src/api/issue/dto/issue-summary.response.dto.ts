import { IssueSummaryResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class IssueSummaryResponseDto extends createZodDto(
  IssueSummaryResponseSchema
) {}
