import { Module } from "@nestjs/common";

import { ApiAuthModule as AuthModule } from "./auth/auth.module";

@Module({
  imports: [AuthModule],
})
export class ApiModule {}
