import { randomUUID } from "node:crypto";

import {
  ExportJobStatus,
  IssuePriority,
  IssueStatus,
  OrganizationRole,
} from "@generated/prisma";
import { Test } from "@nestjs/testing";

import { CommonModule } from "@/common/modules";
import { TenantContextService } from "@/common/services";
import { DatabaseModule } from "@/database/database.module";
import { DatabaseService } from "@/database/database.service";
import { JobsModule } from "@/jobs/jobs.module";
import { exportObjectKey } from "@/storage/storage.paths";
import { StorageService } from "@/storage/storage.service";

import { EXPORT_OBJECT_TTL_MS } from "./export.constants";
import { CSV_COLUMNS } from "./export.csv";
import { ExportQueueService } from "./export-queue.service";

async function isRedisReachable(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const net = await import("node:net");
    await new Promise<void>((resolve, reject) => {
      const socket = net.connect(
        {
          host: parsed.hostname,
          port: parsed.port ? Number.parseInt(parsed.port, 10) : 6379,
        },
        () => {
          socket.end();
          resolve();
        }
      );
      socket.setTimeout(1000);
      socket.on("timeout", () => {
        socket.destroy();
        reject(new Error("timeout"));
      });
      socket.on("error", reject);
    });
    return true;
  } catch {
    return false;
  }
}

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
 * Integration against local Redis + Postgres + MinIO (not HTTP e2e).
 * Skips when Redis or MinIO is not running (`pnpm docker:up`).
 */
describe("ExportQueueService against Redis", () => {
  it("enqueues a job and the worker writes a CSV object in MinIO", async () => {
    applyLocalMinioEnv();
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    process.env.REDIS_URL ??= redisUrl;

    if (!process.env.DATABASE_URL) {
      console.warn(
        "Skipping export queue integration: DATABASE_URL is not set."
      );
      return;
    }

    if (!(await isRedisReachable(redisUrl))) {
      console.warn(
        "Skipping export queue integration: Redis is not reachable. Start with pnpm docker:up."
      );
      return;
    }

    if (!(await isMinioReachable(process.env.S3_ENDPOINT!))) {
      console.warn(
        "Skipping export queue integration: MinIO is not reachable. Start with pnpm docker:up."
      );
      return;
    }

    const moduleRef = await Test.createTestingModule({
      imports: [CommonModule, DatabaseModule, JobsModule],
    }).compile();

    await moduleRef.init();

    const database = moduleRef.get(DatabaseService);
    const tenantContext = moduleRef.get(TenantContextService);
    const queue = moduleRef.get(ExportQueueService);
    const storage = moduleRef.get(StorageService);
    const client = database.resolveClient();

    const suffix = Date.now().toString(36);
    const user = await client.user.create({
      data: {
        email: `export-queue-${suffix}@rivet.test`,
        firstName: "Ada",
        lastName: "Lovelace",
        passwordHash: "test-hash",
      },
    });
    const organization = await client.organization.create({
      data: { name: `Export Queue Org ${suffix}` },
    });
    await client.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: OrganizationRole.OWNER,
      },
    });

    const seeded = await tenantContext.runWithTenantContext(
      { orgId: organization.id, userId: user.id },
      async () => {
        const project = await client.project.create({
          data: {
            createdById: user.id,
            description: "Export queue CSV",
            key: `EQ${suffix.slice(-4).toUpperCase()}`,
            name: `Export Queue ${suffix}`,
            organizationId: organization.id,
          },
        });

        await client.issue.create({
          data: {
            assigneeId: user.id,
            description: "=cmd, and a newline\nhere",
            number: 1,
            organizationId: organization.id,
            priority: IssuePriority.HIGH,
            projectId: project.id,
            status: IssueStatus.TODO,
            title: "Formula cell",
          },
        });
        await client.issue.create({
          data: {
            description: "plain",
            number: 2,
            organizationId: organization.id,
            priority: IssuePriority.LOW,
            projectId: project.id,
            status: IssueStatus.BACKLOG,
            title: "Unassigned",
          },
        });

        const exportJob = await client.exportJob.create({
          data: {
            idempotencyKey: randomUUID(),
            organizationId: organization.id,
            projectId: project.id,
            requestedById: user.id,
          },
        });

        await queue.enqueue({
          exportJobId: exportJob.id,
          organizationId: organization.id,
          requestedById: user.id,
        });

        return {
          exportJobId: exportJob.id,
          projectKey: project.key,
          projectName: project.name,
        };
      }
    );

    const succeeded = await tenantContext.runWithTenantContext(
      { orgId: organization.id, userId: user.id },
      async () => {
        const deadline = Date.now() + 15_000;
        while (Date.now() < deadline) {
          const row = await client.exportJob.findUnique({
            where: { id: seeded.exportJobId },
          });
          if (
            row?.status === ExportJobStatus.SUCCEEDED ||
            row?.status === ExportJobStatus.FAILED
          ) {
            return row;
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return client.exportJob.findUnique({
          where: { id: seeded.exportJobId },
        });
      }
    );

    expect(succeeded?.status).toBe(ExportJobStatus.SUCCEEDED);
    const objectKey = succeeded?.objectKey;
    expect(objectKey).toBe(
      exportObjectKey(organization.id, seeded.exportJobId)
    );
    expect(succeeded?.expiresAt).toBeInstanceOf(Date);
    const ttlMs = (succeeded?.expiresAt?.getTime() ?? 0) - Date.now();
    expect(ttlMs).toBeGreaterThan(EXPORT_OBJECT_TTL_MS - 60_000);
    expect(ttlMs).toBeLessThanOrEqual(EXPORT_OBJECT_TTL_MS);

    if (!objectKey) {
      throw new Error("expected export object key");
    }

    const csv = await fetch(
      await storage.signGet(objectKey, {
        contentDisposition: 'attachment; filename="export.csv"',
        expiresIn: 300,
      })
    ).then((response) => response.text());

    expect(csv.startsWith("\uFEFF")).toBe(false);
    expect(csv.startsWith(`${CSV_COLUMNS.join(",")}\r\n`)).toBe(true);
    expect(csv).toContain("'=cmd, and a newline\nhere");
    expect(csv).toContain(`${seeded.projectKey}-1`);
    expect(csv).toContain(`${seeded.projectKey}-2`);
    expect(csv).toContain("Ada Lovelace");
    expect(csv).toContain(seeded.projectName);

    await moduleRef.close();
  }, 30_000);
});
