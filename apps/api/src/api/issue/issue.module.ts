import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";
import { IssueModule } from "@/modules/issue/issue.module";
import { ProjectModule } from "@/modules/project/project.module";

import { IssueController } from "./issue.controller";
import { IssueService } from "./issue.service";

@Module({
  imports: [DatabaseModule, IssueModule, ProjectModule],
  controllers: [IssueController],
  providers: [IssueService],
})
export class ApiIssueModule {}
