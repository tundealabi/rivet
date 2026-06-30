import { Module } from "@nestjs/common";

import { CommonModule } from "@/common/common.module";
import { DatabaseModule } from "@/database/database.module";

import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";

@Module({
  imports: [CommonModule, DatabaseModule],
  controllers: [],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
