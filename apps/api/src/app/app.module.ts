import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import { ApiModule } from "@/api/api.module";
import {
  HttpRequestLoggerMiddleware,
  RequestIdMiddleware,
  TrimRequestBodyMiddleware,
} from "@/common/middleware";
import { CommonModule } from "@/common/modules";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [CommonModule, ApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        RequestIdMiddleware,
        HttpRequestLoggerMiddleware,
        TrimRequestBodyMiddleware
      )
      .forRoutes("*");
  }
}
