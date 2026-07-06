import { RefreshAuthResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class RefreshAuthResponseDto extends createZodDto(
  RefreshAuthResponseSchema
) {}
