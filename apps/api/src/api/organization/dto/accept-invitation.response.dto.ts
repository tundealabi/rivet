import { AcceptInvitationResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class AcceptInvitationResponseDto extends createZodDto(
  AcceptInvitationResponseSchema
) {}
