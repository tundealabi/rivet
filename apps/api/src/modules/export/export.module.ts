import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";

import { ExportRepository } from "./export.repository";
import { ExportService } from "./export.service";

@Module({
  imports: [DatabaseModule],
  providers: [ExportRepository, ExportService],
  exports: [ExportService],
})
export class ExportModule {}
