import { InvitationPreviewQuerySchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class InvitationPreviewQueryDto extends createZodDto(
  InvitationPreviewQuerySchema
) {}
