import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { CommonModule } from "@/common/common.module";

import { AuthService } from "./auth.service";

@Module({
  imports: [CommonModule, JwtModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
