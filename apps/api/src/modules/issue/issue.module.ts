import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";

import { IssueRepository } from "./issue.repository";
import { IssueService } from "./issue.service";

@Module({
  imports: [DatabaseModule],
  providers: [IssueRepository, IssueService],
  exports: [IssueService],
})
export class IssueModule {}
