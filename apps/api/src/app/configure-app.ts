import { INestApplication, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import helmet from "helmet";
import { ZodSerializerInterceptor, ZodValidationPipe } from "nestjs-zod";

import { ENV_KEYS } from "@/common/constants";
import { ApiExceptionFilter } from "@/common/filters";
import { ApiResponseInterceptor } from "@/common/interceptors";

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);

  app.setGlobalPrefix(
    configService.getOrThrow<string>(ENV_KEYS.APP_GLOBAL_PREFIX)
  );

  app.enableCors({
    origin: configService.getOrThrow<string[]>(ENV_KEYS.APP_CORS_ORIGINS),
  });

  app.use(helmet());

  app.useGlobalPipes(new ZodValidationPipe());

  app.useGlobalInterceptors(
    new ApiResponseInterceptor(app.get(Reflector)),
    new ZodSerializerInterceptor(app.get(Reflector))
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: configService.getOrThrow<string>(
      ENV_KEYS.APP_VERSIONING_VERSION
    ),
    prefix: configService.getOrThrow<string>(ENV_KEYS.APP_VERSIONING_PREFIX),
  });
}
