import { Module } from "@nestjs/common";

import { ApiAuthModule as AuthModule } from "./auth/auth.module";
import { ApiIssueModule as IssueModule } from "./issue/issue.module";
import { ApiOrganizationModule as OrganizationModule } from "./organization/organization.module";
import { ApiProjectModule as ProjectModule } from "./project/project.module";

@Module({
  imports: [AuthModule, IssueModule, OrganizationModule, ProjectModule],
})
export class ApiModule {}
