import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ClsModule } from "nestjs-cls";

import { OrgMemberGuard } from "@/common/guards";
import {
  HashService,
  TenantContextService,
  TokenService,
} from "@/common/services";
import configs from "@/config";
import { OrgMemberModule } from "@/modules/org-member/org-member.module";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: configs,
    }),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 3,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 20,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 100,
      },
    ]),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
    OrgMemberModule,
  ],
  providers: [HashService, TokenService, TenantContextService, OrgMemberGuard],
  exports: [HashService, TokenService, TenantContextService, OrgMemberGuard],
})
export class CommonModule {}
