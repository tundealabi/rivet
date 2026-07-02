import {
  SignInAuthResponseSchema,
  SignUpAuthResponseSchema,
} from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class SignInAuthResponseDto extends createZodDto(
  SignInAuthResponseSchema
) {}

export class SignUpAuthResponseDto extends createZodDto(
  SignUpAuthResponseSchema
) {}
