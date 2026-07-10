import { Module } from "@nestjs/common";

import { OrgMemberModule } from "@/modules/org-member/org-member.module";
import { ProjectModule } from "@/modules/project/project.module";

import { ProjectController } from "./project.controller";
import { ProjectService } from "./project.service";

@Module({
  imports: [OrgMemberModule, ProjectModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ApiProjectModule {}
