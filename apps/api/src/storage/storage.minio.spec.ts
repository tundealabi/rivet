import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";

import configs from "@/config";

import { StorageModule } from "./storage.module";
import { exportObjectKey } from "./storage.paths";
import { StorageService } from "./storage.service";

function applyLocalMinioEnv(): void {
  process.env.S3_ENDPOINT ??= "http://localhost:9000";
  process.env.S3_REGION ??= "us-east-1";
  process.env.S3_BUCKET ??= "rivet-exports";
  process.env.S3_ACCESS_KEY ??= "rivet";
  process.env.S3_SECRET_KEY ??= "rivetminio";
  process.env.S3_FORCE_PATH_STYLE ??= "true";
  process.env.CLIENT_WEB_BASE_URL ??= "http://localhost:3000";
  process.env.APP_CORS_ORIGINS ??= "http://localhost:3000";
}

async function isMinioReachable(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(new URL("/minio/health/live", endpoint));
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Integration check against local MinIO.
 * Skips when MinIO is not running (`pnpm docker:up`).
 */
describe("StorageService against MinIO", () => {
  beforeAll(() => {
    applyLocalMinioEnv();
  });

  it("uploads a few bytes and produces a GET URL MinIO accepts", async () => {
    const reachable = await isMinioReachable(process.env.S3_ENDPOINT!);
    if (!reachable) {
      console.warn(
        "Skipping MinIO integration: nothing at S3_ENDPOINT. Start with pnpm docker:up."
      );
      return;
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          cache: true,
          isGlobal: true,
          load: configs,
        }),
        StorageModule,
      ],
    }).compile();

    await moduleRef.init();

    const storage = moduleRef.get(StorageService);
    const key = exportObjectKey(randomUUID(), randomUUID());
    const csv = "key,title\nRIV-1,hello export\n";

    await storage.upload(key, Buffer.from(csv, "utf8"));

    const downloadUrl = await storage.signGet(key, {
      expiresIn: 300,
      contentDisposition: 'attachment; filename="export.csv"',
    });

    const response = await fetch(downloadUrl);
    expect(response.ok).toBe(true);
    expect(await response.text()).toBe(csv);

    const streamKey = exportObjectKey(randomUUID(), randomUUID());
    await storage.upload(streamKey, Readable.from([csv]));
    const streamUrl = await storage.signGet(streamKey, {
      expiresIn: 300,
      contentDisposition: 'attachment; filename="export.csv"',
    });
    const streamResponse = await fetch(streamUrl);
    expect(streamResponse.ok).toBe(true);
    expect(await streamResponse.text()).toBe(csv);

    await moduleRef.close();
  });
});
