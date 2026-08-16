import { Readable } from "node:stream";

import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ENV_KEYS } from "@/common/constants";

import { StorageService } from "./storage.service";

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock("@aws-sdk/lib-storage", () => ({
  Upload: jest.fn().mockImplementation(() => ({
    done: jest.fn().mockResolvedValue({}),
  })),
}));

const UploadMock = Upload as jest.MockedClass<typeof Upload>;

const getSignedUrlMock = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;

function createService(send: jest.Mock) {
  const client = {
    send,
    destroy: jest.fn(),
  } as unknown as S3Client;

  const values: Record<string, unknown> = {
    [ENV_KEYS.S3_BUCKET]: "rivet-exports",
    [ENV_KEYS.S3_CORS_ORIGINS]: ["http://localhost:3000"],
    [ENV_KEYS.S3_FORCE_PATH_STYLE]: false,
  };

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      if (!(key in values)) {
        throw new Error(`missing config ${key}`);
      }
      return values[key];
    }),
  } as unknown as ConfigService;

  return {
    client,
    service: new StorageService(client, configService),
  };
}

describe("StorageService", () => {
  beforeEach(() => {
    getSignedUrlMock.mockReset();
    UploadMock.mockClear();
  });

  it("builds the export object key as {orgId}/exports/{jobId}.csv", () => {
    const { service } = createService(jest.fn());
    expect(
      service.objectKey(
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222"
      )
    ).toBe(
      "11111111-1111-1111-1111-111111111111/exports/22222222-2222-2222-2222-222222222222.csv"
    );
  });

  it("uploads a buffer to the configured bucket", async () => {
    const send = jest.fn().mockResolvedValue({});
    const { service } = createService(send);
    const body = Buffer.from("a,b\n");

    await service.upload("org/exports/job.csv", body);

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({
      Bucket: "rivet-exports",
      Key: "org/exports/job.csv",
      Body: body,
      ContentType: "text/csv; charset=utf-8",
    });
  });

  it("uploads a stream body via multipart Upload", async () => {
    const send = jest.fn().mockResolvedValue({});
    const { service, client } = createService(send);
    const body = Readable.from(["title\n"]);

    await service.upload("org/exports/job.csv", body);

    expect(send).not.toHaveBeenCalled();
    expect(UploadMock).toHaveBeenCalledTimes(1);
    expect(UploadMock).toHaveBeenCalledWith({
      client,
      params: {
        Bucket: "rivet-exports",
        Key: "org/exports/job.csv",
        Body: body,
        ContentType: "text/csv; charset=utf-8",
      },
    });
  });

  it("signs a GET URL with expiry and content-disposition", async () => {
    const send = jest.fn();
    const { service, client } = createService(send);
    getSignedUrlMock.mockResolvedValue(
      "http://localhost:9000/rivet-exports/org/exports/job.csv?X-Amz-Signature=test"
    );

    const url = await service.signGet("org/exports/job.csv", {
      expiresIn: 300,
      contentDisposition: 'attachment; filename="export.csv"',
    });

    expect(url).toContain("X-Amz-Signature=test");
    expect(getSignedUrlMock).toHaveBeenCalledTimes(1);
    const [calledClient, command, signOptions] = getSignedUrlMock.mock.calls[0];
    expect(calledClient).toBe(client);
    expect(command).toBeInstanceOf(GetObjectCommand);
    expect(command.input).toEqual({
      Bucket: "rivet-exports",
      Key: "org/exports/job.csv",
      ResponseContentDisposition: 'attachment; filename="export.csv"',
    });
    expect(signOptions).toEqual({ expiresIn: 300 });
  });

  it("creates a missing bucket then applies CORS from web origins", async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error("missing"), {
          name: "NotFound",
          $metadata: { httpStatusCode: 404 },
        })
      )
      .mockResolvedValue({});
    const { service } = createService(send);

    await service.onModuleInit();

    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
    expect(send.mock.calls[1][0]).toBeInstanceOf(CreateBucketCommand);
    expect(send.mock.calls[2][0]).toBeInstanceOf(PutBucketCorsCommand);
    const cors = send.mock.calls[2][0] as PutBucketCorsCommand;
    expect(
      cors.input.CORSConfiguration?.CORSRules?.[0]?.AllowedOrigins
    ).toEqual(["http://localhost:3000"]);
  });

  it("skips CreateBucket when the bucket already exists", async () => {
    const send = jest.fn().mockResolvedValue({});
    const { service } = createService(send);

    await service.onModuleInit();

    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
    expect(send.mock.calls[1][0]).toBeInstanceOf(PutBucketCorsCommand);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("skips PutBucketCors when force path style is enabled (MinIO)", async () => {
    const send = jest.fn().mockResolvedValue({});
    const client = {
      send,
      destroy: jest.fn(),
    } as unknown as S3Client;
    const values: Record<string, unknown> = {
      [ENV_KEYS.S3_BUCKET]: "rivet-exports",
      [ENV_KEYS.S3_CORS_ORIGINS]: ["http://localhost:3000"],
      [ENV_KEYS.S3_FORCE_PATH_STYLE]: true,
    };
    const service = new StorageService(client, {
      getOrThrow: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService);

    await service.onModuleInit();

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
  });

  it("does not throw when S3 is unreachable on init", async () => {
    const send = jest.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const { service } = createService(send);

    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });

  it("still initializes when CORS is not implemented", async () => {
    const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
    const send = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(
        Object.assign(new Error("not implemented"), { name: "NotImplemented" })
      );
    const { service } = createService(send);

    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
    expect(send.mock.calls[1][0]).toBeInstanceOf(PutBucketCorsCommand);
    expect(warn).toHaveBeenCalledWith(
      "PutBucketCors is not supported on this endpoint. Using CORS from infrastructure (local: MinIO MINIO_API_CORS_ALLOW_ORIGIN)."
    );
    warn.mockRestore();
  });
});
