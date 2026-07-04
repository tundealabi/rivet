import {
  EmailVerificationStatusResponseSchema,
  ResendEmailVerificationResponseSchema,
  SendEmailVerificationResponseSchema,
  VerifyEmailByEmailRequestSchema,
  VerifyEmailRequestSchema,
  VerifyEmailResponseSchema,
} from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class VerifyEmailByEmailRequestDto extends createZodDto(
  VerifyEmailByEmailRequestSchema
) {}

export class VerifyEmailRequestDto extends createZodDto(
  VerifyEmailRequestSchema
) {}

export class EmailVerificationStatusResponseDto extends createZodDto(
  EmailVerificationStatusResponseSchema
) {}

export class SendEmailVerificationResponseDto extends createZodDto(
  SendEmailVerificationResponseSchema
) {}

export class ResendEmailVerificationResponseDto extends createZodDto(
  ResendEmailVerificationResponseSchema
) {}

export class VerifyEmailResponseDto extends createZodDto(
  VerifyEmailResponseSchema
) {}
