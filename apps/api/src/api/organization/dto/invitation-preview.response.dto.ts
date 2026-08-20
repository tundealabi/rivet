import { InvitationPreviewResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class InvitationPreviewResponseDto extends createZodDto(
  InvitationPreviewResponseSchema
) {}
