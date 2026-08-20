import { INestApplication, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Logger as PinoNestLogger } from "nestjs-pino";
import { ZodValidationPipe } from "nestjs-zod";

import { ENV_KEYS, UNPREFIXED_PROBE_ROUTES } from "@/common/constants";
import { ApiExceptionFilter } from "@/common/filters";
import {
  ApiResponseInterceptor,
  ApiZodSerializerInterceptor,
} from "@/common/interceptors";

export function configureApp(app: INestApplication): void {
  app.useLogger(app.get(PinoNestLogger));

  const configService = app.get(ConfigService);

  app.setGlobalPrefix(
    configService.getOrThrow<string>(ENV_KEYS.APP_GLOBAL_PREFIX),
    { exclude: [...UNPREFIXED_PROBE_ROUTES] }
  );

  app.enableCors({
    credentials: true,
    origin: configService.getOrThrow<string[]>(ENV_KEYS.APP_CORS_ORIGINS),
  });

  app.use(helmet());

  app.use(cookieParser());

  app.useGlobalPipes(new ZodValidationPipe());

  app.useGlobalInterceptors(
    new ApiResponseInterceptor(app.get(Reflector)),
    new ApiZodSerializerInterceptor(app.get(Reflector))
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
