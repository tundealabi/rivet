import { UserOrganizationResponseSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class UserOrganizationResponseDto extends createZodDto(
  UserOrganizationResponseSchema
) {}
