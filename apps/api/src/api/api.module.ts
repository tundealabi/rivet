import { Module } from "@nestjs/common";

import { ApiAuthModule as AuthModule } from "./auth/auth.module";
import { ApiOrganizationModule as OrganizationModule } from "./organization/organization.module";
import { ApiProjectModule as ProjectModule } from "./project/project.module";

@Module({
  imports: [AuthModule, OrganizationModule, ProjectModule],
})
export class ApiModule {}
