import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";
import { JobsModule } from "@/jobs/jobs.module";
import { ExportModule } from "@/modules/export/export.module";
import { OrgModule } from "@/modules/org/org.module";
import { ProjectModule } from "@/modules/project/project.module";
import { StorageModule } from "@/storage/storage.module";

import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";

@Module({
  imports: [
    DatabaseModule,
    ExportModule,
    JobsModule,
    OrgModule,
    ProjectModule,
    StorageModule,
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ApiExportModule {}
