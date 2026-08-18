import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";
import { OrgModule } from "@/modules/org/org.module";
import { ProjectModule } from "@/modules/project/project.module";

import { ProjectController } from "./project.controller";
import { ProjectService } from "./project.service";

@Module({
  imports: [DatabaseModule, OrgModule, ProjectModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ApiProjectModule {}
