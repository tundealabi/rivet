import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthTokenService } from "./services";

@Module({
  imports: [JwtModule],
  providers: [AuthTokenService],
  exports: [AuthTokenService],
})
export class AuthModule {}
