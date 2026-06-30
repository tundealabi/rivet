import { LoginAuthRequestSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class LoginAuthRequestDto extends createZodDto(LoginAuthRequestSchema) {}
