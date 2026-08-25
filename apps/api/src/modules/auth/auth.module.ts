import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";

import { DatabaseModule } from "@/database/database.module";

import { AuthUserJwtGuard } from "./auth.guard";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AuthUserJwtStrategy } from "./auth.strategy";

@Module({
  imports: [DatabaseModule, JwtModule],
  providers: [
    AuthRepository,
    AuthService,
    AuthUserJwtStrategy,
    AuthUserJwtGuard,
    {
      provide: APP_GUARD,
      useExisting: AuthUserJwtGuard,
    },
  ],
  exports: [AuthService, AuthUserJwtGuard],
})
export class AuthModule {}
