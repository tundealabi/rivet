import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";

import { ProjectRepository } from "./project.repository";
import { ProjectService } from "./project.service";

@Module({
  imports: [DatabaseModule],
  providers: [ProjectRepository, ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
