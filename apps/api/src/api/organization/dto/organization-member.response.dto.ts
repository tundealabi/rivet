import { OrganizationMemberResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class OrganizationMemberResponseDto extends createZodDto(
  OrganizationMemberResponseSchema
) {}
