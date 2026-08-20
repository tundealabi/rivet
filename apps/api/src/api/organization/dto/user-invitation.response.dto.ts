import { UserInvitationResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class UserInvitationResponseDto extends createZodDto(
  UserInvitationResponseSchema
) {}
