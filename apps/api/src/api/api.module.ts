import { Module } from "@nestjs/common";

import { ApiAuthModule as AuthModule } from "./auth/auth.module";
import { ApiProjectModule as ProjectModule } from "./project/project.module";

@Module({
  imports: [AuthModule, ProjectModule],
})
export class ApiModule {}
