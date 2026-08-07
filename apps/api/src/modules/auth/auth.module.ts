import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { DatabaseModule } from "@/database/database.module";

import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AuthUserJwtStrategy } from "./auth.strategy";

@Module({
  imports: [DatabaseModule, JwtModule],
  providers: [AuthRepository, AuthService, AuthUserJwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
