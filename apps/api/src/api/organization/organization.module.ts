import { Module } from "@nestjs/common";

import { OrgMemberModule } from "@/modules/org-member/org-member.module";

import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";

@Module({
  imports: [OrgMemberModule],
  controllers: [OrganizationController],
  providers: [OrganizationService],
})
export class ApiOrganizationModule {}
