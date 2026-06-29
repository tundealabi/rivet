import {
  BadRequestException,
  Logger,
  ValidationPipe,
  VersioningType,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";

import { AppModule } from "@/app/app.module";

import { ENV_KEYS } from "./common/constants";
import {
  ApiGeneralErrorEntity,
  ApiGeneralErrorResponseEntity,
  ApiPaginatedSuccessResponseEntity,
  ApiPaginationEntity,
  ApiResponseEntity,
  ApiSuccessResponseEntity,
  ApiValidationErrorEntity,
  ApiValidationErrorResponseEntity,
} from "./common/entities";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const corsOrigins = configService.getOrThrow<string[]>(
    ENV_KEYS.APP_CORS_ORIGINS
  );

  const globalPrefix: string = configService.getOrThrow<string>(
    ENV_KEYS.APP_GLOBAL_PREFIX
  );

  const versioningPrefix: string = configService.getOrThrow<string>(
    ENV_KEYS.APP_VERSIONING_PREFIX
  );

  const version: string = configService.getOrThrow<string>(
    ENV_KEYS.APP_VERSIONING_VERSION
  );

  const port: number = configService.getOrThrow<number>(ENV_KEYS.APP_HTTP_PORT);

  const logger = new Logger();

  app.setGlobalPrefix(globalPrefix);

  // enable CORS for local/dev client development
  app.enableCors({ origin: corsOrigins });

  //collection of smaller middleware functions that set security-related HTTP headers
  app.use(helmet());

  // ensure all endpoints are protected from receiving incorrect data
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => new BadRequestException(errors),
      whitelist: true,
      transform: true,
    })
  );

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: version,
    prefix: versioningPrefix,
  });

  // dev-only features (e.g. API docs); controlled by APP_ENABLE_DEV_FEATURES
  const enableDevFeatures =
    configService.get<boolean>("app.enableDevFeatures") ?? false;

  if (enableDevFeatures) {
    const config = new DocumentBuilder()
      .setTitle("Rivet API")
      .setDescription("Rivet multi-tenant issue tracker API")
      .setVersion("1.0")
      .addBearerAuth({
        bearerFormat: "JWT",
        scheme: "bearer",
        type: "http",
      })
      .build();
    const documentFactory = () =>
      SwaggerModule.createDocument(app, config, {
        extraModels: [
          ApiResponseEntity,
          ApiSuccessResponseEntity,
          ApiPaginatedSuccessResponseEntity,
          ApiGeneralErrorResponseEntity,
          ApiValidationErrorResponseEntity,
          ApiGeneralErrorEntity,
          ApiValidationErrorEntity,
          ApiPaginationEntity,
        ],
      });
    SwaggerModule.setup("docs", app, documentFactory);
  }

  await app.listen(port);

  logger.log(`==========================================================`);

  logger.log(
    `🚀 Http Server running on ${await app.getUrl()}${globalPrefix}/${versioningPrefix}${version}`,
    "NestApplication"
  );

  logger.log(`==========================================================`);

  if (enableDevFeatures) {
    logger.log(
      `🚀 Application Docs is running on ${await app.getUrl()}/docs`,
      "NestApplication"
    );
    logger.log(`==========================================================`);
  }
}
void bootstrap();
