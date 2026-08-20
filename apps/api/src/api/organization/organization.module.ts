import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";
import { OrgModule } from "@/modules/org/org.module";
import { OrgInviteModule } from "@/modules/org-invite/org-invite.module";
import { OrgMemberModule } from "@/modules/org-member/org-member.module";
import { UserModule } from "@/modules/user/user.module";

import { InvitationsController } from "./invitations.controller";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";

@Module({
  imports: [
    DatabaseModule,
    OrgInviteModule,
    OrgMemberModule,
    OrgModule,
    UserModule,
  ],
  controllers: [InvitationsController, OrganizationController],
  providers: [OrganizationService],
})
export class ApiOrganizationModule {}
