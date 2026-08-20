import { OrganizationInviteResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class OrganizationInviteResponseDto extends createZodDto(
  OrganizationInviteResponseSchema
) {}
