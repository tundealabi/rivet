import { Global, MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ClsModule } from "nestjs-cls";

import {
  THROTTLER_LONG,
  THROTTLER_MEDIUM,
  THROTTLER_SHORT,
} from "@/common/constants";
import { OrgMemberGuard, OrgRoleGuard } from "@/common/guards";
import { RequestIdMiddleware } from "@/common/middleware";
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
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: THROTTLER_SHORT,
          ttl: 1000,
          limit: 3,
        },
        {
          name: THROTTLER_MEDIUM,
          ttl: 10000,
          limit: 20,
        },
        {
          name: THROTTLER_LONG,
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
    OrgMemberModule,
  ],
  providers: [
    HashService,
    TokenService,
    TenantContextService,
    OrgMemberGuard,
    OrgRoleGuard,
    ThrottlerGuard,
    {
      provide: APP_GUARD,
      useExisting: ThrottlerGuard,
    },
  ],
  exports: [
    HashService,
    TokenService,
    TenantContextService,
    OrgMemberGuard,
    OrgRoleGuard,
    OrgMemberModule,
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
