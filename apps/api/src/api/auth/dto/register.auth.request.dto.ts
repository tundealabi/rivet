import { RegisterAuthRequestSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class RegisterAuthRequestDto extends createZodDto(
  RegisterAuthRequestSchema
) {}
