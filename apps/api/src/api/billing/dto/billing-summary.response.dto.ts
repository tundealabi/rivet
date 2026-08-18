import { BillingSummaryResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class BillingSummaryResponseDto extends createZodDto(
  BillingSummaryResponseSchema
) {}
