import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { CommonModule } from "@/common/common.module";
import { DatabaseModule } from "@/database/database.module";

import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

@Module({
  imports: [CommonModule, DatabaseModule, JwtModule],
  providers: [AuthRepository, AuthService],
  exports: [AuthService],
})
export class AuthModule {}
