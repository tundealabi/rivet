import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";

import { OrgRepository } from "./org.repository";
import { OrgService } from "./org.service";

@Module({
  imports: [DatabaseModule],
  providers: [OrgRepository, OrgService],
  exports: [OrgService],
})
export class OrgModule {}
