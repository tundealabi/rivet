import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";

import { OrgMemberRepository } from "./org-member.repository";
import { OrgMemberService } from "./org-member.service";

@Module({
  imports: [DatabaseModule],
  providers: [OrgMemberRepository, OrgMemberService],
  exports: [OrgMemberService],
})
export class OrgMemberModule {}
