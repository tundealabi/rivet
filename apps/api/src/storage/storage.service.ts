import type { Readable } from "node:stream";

import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  type PutObjectCommandInput,
  type S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ENV_KEYS } from "@/common/constants";

import { S3_CLIENT } from "./storage.constants";
import { exportObjectKey } from "./storage.paths";

export type UploadBody = Buffer | Readable | Uint8Array;

export type SignGetOptions = {
  contentDisposition: string;
  expiresIn: number;
};

@Injectable()
export class StorageService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket: string;
  private readonly corsOrigins: string[];
  private readonly forcePathStyle: boolean;

  constructor(
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly configService: ConfigService
  ) {
    this.bucket = this.configService.getOrThrow<string>(ENV_KEYS.S3_BUCKET);
    this.corsOrigins = this.configService.getOrThrow<string[]>(
      ENV_KEYS.S3_CORS_ORIGINS
    );
    this.forcePathStyle = this.configService.getOrThrow<boolean>(
      ENV_KEYS.S3_FORCE_PATH_STYLE
    );
  }

  objectKey(organizationId: string, exportJobId: string): string {
    return exportObjectKey(organizationId, exportJobId);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureBucket();
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        "Failed to initialize S3 bucket. Export uploads will fail until object storage is reachable.",
        stack
      );
      return;
    }

    try {
      await this.applyBucketCors();
    } catch (error) {
      if (isNotImplemented(error)) {
        this.logger.warn(
          "PutBucketCors is not supported on this endpoint. Using CORS from infrastructure (local: MinIO MINIO_API_CORS_ALLOW_ORIGIN)."
        );
        return;
      }

      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.warn(
        "Failed to apply bucket CORS. Signed downloads from the browser may be blocked.",
        stack
      );
    }
  }

  onModuleDestroy(): void {
    this.s3.destroy();
  }

  async upload(key: string, body: UploadBody): Promise<void> {
    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: "text/csv; charset=utf-8",
    };

    if (body instanceof Uint8Array) {
      await this.s3.send(new PutObjectCommand(params));
      return;
    }

    await new Upload({ client: this.s3, params }).done();
  }

  async signGet(key: string, options: SignGetOptions): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: options.contentDisposition,
      }),
      { expiresIn: options.expiresIn }
    );
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return;
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
    }

    await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
    this.logger.log(`Created S3 bucket ${this.bucket}`);
  }

  private async applyBucketCors(): Promise<void> {
    if (this.forcePathStyle) {
      return;
    }

    if (this.corsOrigins.length === 0) {
      this.logger.warn(
        "Skipping bucket CORS: no origins from CLIENT_WEB_BASE_URL / APP_CORS_ORIGINS"
      );
      return;
    }

    await this.s3.send(
      new PutBucketCorsCommand({
        Bucket: this.bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "HEAD"],
              AllowedOrigins: this.corsOrigins,
              ExposeHeaders: [
                "ETag",
                "Content-Disposition",
                "Content-Length",
                "Content-Type",
              ],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );
  }
}

function isNotFound(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const name = "name" in error ? String(error.name) : "";
  if (name === "NotFound" || name === "NoSuchBucket" || name === "404") {
    return true;
  }

  const metadata = "$metadata" in error ? error.$metadata : undefined;
  if (
    typeof metadata === "object" &&
    metadata !== null &&
    "httpStatusCode" in metadata &&
    metadata.httpStatusCode === 404
  ) {
    return true;
  }

  return false;
}

function isNotImplemented(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const name = "name" in error ? String(error.name) : "";
  if (name === "NotImplemented") {
    return true;
  }

  const metadata = "$metadata" in error ? error.$metadata : undefined;
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "httpStatusCode" in metadata &&
    metadata.httpStatusCode === 501
  );
}
