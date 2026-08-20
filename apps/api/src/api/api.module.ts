import { Module } from "@nestjs/common";

import { ApiAuthModule as AuthModule } from "./auth/auth.module";
import { ApiBillingModule as BillingModule } from "./billing/billing.module";
import { ApiExportModule as ExportModule } from "./export/export.module";
import { ApiIssueModule as IssueModule } from "./issue/issue.module";
import { ApiOrganizationModule as OrganizationModule } from "./organization/organization.module";
import { ApiProjectModule as ProjectModule } from "./project/project.module";
import { ApiWebhooksModule as WebhooksModule } from "./webhooks/webhooks.module";

@Module({
  imports: [
    AuthModule,
    BillingModule,
    ExportModule,
    IssueModule,
    OrganizationModule,
    ProjectModule,
    WebhooksModule,
  ],
})
export class ApiModule {}
