import { SignUpAuthResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class SignUpAuthResponseDto extends createZodDto(
  SignUpAuthResponseSchema
) {}
