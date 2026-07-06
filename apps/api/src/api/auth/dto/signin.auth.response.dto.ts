import { SignInAuthResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class SignInAuthResponseDto extends createZodDto(
  SignInAuthResponseSchema
) {}
