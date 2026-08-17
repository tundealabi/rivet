import { AcceptInvitationByTokenRequestSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class AcceptInvitationByTokenRequestDto extends createZodDto(
  AcceptInvitationByTokenRequestSchema
) {}
