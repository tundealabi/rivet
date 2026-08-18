import { BillingCheckoutResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class BillingCheckoutResponseDto extends createZodDto(
  BillingCheckoutResponseSchema
) {}
