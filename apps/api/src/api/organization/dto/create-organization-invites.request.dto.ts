import { CreateOrganizationInvitesRequestSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class CreateOrganizationInvitesRequestDto extends createZodDto(
  CreateOrganizationInvitesRequestSchema
) {}
