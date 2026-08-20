import { CreateOrganizationRequestSchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class CreateOrganizationRequestDto extends createZodDto(
  CreateOrganizationRequestSchema
) {}
