import { Module } from "@nestjs/common";

import { ProjectModule } from "@/modules/project/project.module";

import { ProjectController } from "./project.controller";
import { ProjectService } from "./project.service";

@Module({
  imports: [ProjectModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ApiProjectModule {}
