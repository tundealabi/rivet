import { ListOrganizationMembersQuerySchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class ListOrganizationMembersQueryDto extends createZodDto(
  ListOrganizationMembersQuerySchema
) {}
