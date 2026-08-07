import { Module } from "@nestjs/common";

import { DatabaseModule } from "@/database/database.module";

import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
