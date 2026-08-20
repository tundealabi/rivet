import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";

import { OrgInviteRepository } from "./org-invite.repository";
import { OrgInviteService } from "./org-invite.service";

@Module({
  imports: [DatabaseModule],
  providers: [OrgInviteRepository, OrgInviteService],
  exports: [OrgInviteService],
})
export class OrgInviteModule {}
