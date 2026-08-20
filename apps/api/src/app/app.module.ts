import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ClsService } from "nestjs-cls";
import { LoggerModule } from "nestjs-pino";

import { ApiModule } from "@/api/api.module";
import type { TenantContextStore } from "@/common/constants";
import { Helpers } from "@/common/helpers";
import { PinoTenantBindingsInterceptor } from "@/common/interceptors";
import {
  HttpRequestLoggerMiddleware,
  TrimRequestBodyMiddleware,
} from "@/common/middleware";
import { CommonModule } from "@/common/modules";
import { ProbeModule } from "@/probes/probe.module";

@Module({
  imports: [
    CommonModule,
    LoggerModule.forRootAsync({
      inject: [ClsService],
      useFactory: (cls: ClsService<TenantContextStore>) => ({
        assignResponse: true,
        pinoHttp: Helpers.createPinoHttpOptions(cls),
      }),
    }),
    ApiModule,
    ProbeModule,
  ],
  providers: [
    HttpRequestLoggerMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: PinoTenantBindingsInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(HttpRequestLoggerMiddleware, TrimRequestBodyMiddleware)
      .forRoutes("*");
  }
}
