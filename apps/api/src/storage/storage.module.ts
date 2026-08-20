import { S3Client } from "@aws-sdk/client-s3";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ENV_KEYS } from "@/common/constants";

import { S3_CLIENT } from "./storage.constants";
import { StorageService } from "./storage.service";

@Module({
  providers: [
    {
      provide: S3_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): S3Client =>
        new S3Client({
          credentials: {
            accessKeyId: config.getOrThrow<string>(ENV_KEYS.S3_ACCESS_KEY),
            secretAccessKey: config.getOrThrow<string>(ENV_KEYS.S3_SECRET_KEY),
          },
          endpoint: config.getOrThrow<string>(ENV_KEYS.S3_ENDPOINT),
          forcePathStyle: config.getOrThrow<boolean>(
            ENV_KEYS.S3_FORCE_PATH_STYLE
          ),
          region: config.getOrThrow<string>(ENV_KEYS.S3_REGION),
          requestChecksumCalculation: "WHEN_REQUIRED",
          responseChecksumValidation: "WHEN_REQUIRED",
        }),
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
