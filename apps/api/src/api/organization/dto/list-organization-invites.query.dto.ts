import { ListOrganizationInvitesQuerySchema } from "@rivet/shared/api";
import { createZodDto } from "nestjs-zod";

export class ListOrganizationInvitesQueryDto extends createZodDto(
  ListOrganizationInvitesQuerySchema
) {}
