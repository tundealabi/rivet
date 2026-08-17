import { OrganizationInviteCreatedResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class OrganizationInviteCreatedResponseDto extends createZodDto(
  OrganizationInviteCreatedResponseSchema
) {}
