import { OrganizationRole } from "@generated/prisma";
import type { INestApplication } from "@nestjs/common";
import type {
  ApiGeneralErrorResponseWire,
  ApiSuccessResponseWire,
  ApiValidationErrorResponseWire,
  ExportJobResponseWire,
} from "@rivet/shared/api";
import { IDEMPOTENCY_KEY_HEADER, PLAN_LIMITS } from "@rivet/shared/constants";
import { ErrorCode, ExportJobStatus, PlanTier } from "@rivet/shared/enums";
import request from "supertest";
import type { App } from "supertest/types";

import { TenantContextService } from "@/common/services";
import { DatabaseService } from "@/database/database.service";
import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

import { API_PREFIX } from "./helpers/constants";
import { createE2eApp } from "./helpers/e2e-app.helper";
import {
  type RegisteredUser,
  registerLoginAndGetOrg,
} from "./helpers/fixtures/auth";
import { createIssue } from "./helpers/fixtures/issue";
import { addOrgMember } from "./helpers/fixtures/org-member";
import { createProject } from "./helpers/fixtures/project";

const CSV_INJECTION_TITLE = "=cmd";
const CSV_QUOTED_DESCRIPTION = 'hello, "world"\nnext';
const POLL_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 250;

describe("Issue CSV export (e2e)", () => {
  let app: INestApplication<App>;
  let owner: RegisteredUser;
  let otherOrg: RegisteredUser;
  let sameOrgMember: RegisteredUser;
  let viewer: RegisteredUser;
  let quotaOwner: RegisteredUser;
  let projectId: string;
  let projectKey: string;
  let projectName: string;
  let quotaProjectId: string;
  let issueNumber: number;

  beforeAll(async () => {
    app = await createE2eApp();

    owner = await registerLoginAndGetOrg(
      app,
      "export-owner",
      "Export Owner Org"
    );
    otherOrg = await registerLoginAndGetOrg(
      app,
      "export-other-org",
      "Export Other Org"
    );
    sameOrgMember = await registerLoginAndGetOrg(
      app,
      "export-member",
      "Export Member Own Org"
    );
    viewer = await registerLoginAndGetOrg(
      app,
      "export-viewer",
      "Export Viewer Own Org"
    );
    quotaOwner = await registerLoginAndGetOrg(
      app,
      "export-quota",
      "Export Quota Org"
    );

    await addOrgMember(app, {
      orgId: owner.orgId,
      role: OrganizationRole.MEMBER,
      userId: sameOrgMember.userId,
    });
    await addOrgMember(app, {
      orgId: owner.orgId,
      role: OrganizationRole.VIEWER,
      userId: viewer.userId,
    });

    const stamp = Date.now().toString(36).slice(-4).toUpperCase();
    projectKey = `EX${stamp}`.slice(0, 10);
    projectName = `Export ${Date.now()}`;
    const project = await createProject(app, owner.accessToken, owner.orgId, {
      description: "Export e2e fixture project",
      key: projectKey,
      name: projectName,
    });
    projectId = project.id;

    const quotaProject = await createProject(
      app,
      quotaOwner.accessToken,
      quotaOwner.orgId,
      {
        description: "Export quota fixture project",
        key: `QT${stamp}`.slice(0, 10),
        name: `Export quota ${Date.now()}`,
      }
    );
    quotaProjectId = quotaProject.id;

    const issue = await createIssue(app, owner.accessToken, owner.orgId, {
      description: CSV_QUOTED_DESCRIPTION,
      projectId,
      title: CSV_INJECTION_TITLE,
    });
    issueNumber = issue.number;
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  it("returns 404 when another org GETs the job", async () => {
    const created = await createExport(
      owner,
      projectId,
      uniqueKey("cross-org")
    );

    const res = await request(app.getHttpServer())
      .get(`${API_PREFIX}/exports/${created.id}`)
      .set(authHeaders(otherOrg))
      .expect(404);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.EXPORT_NOT_FOUND);
  });

  it("returns 404 when a non-requester in the same org GETs the job", async () => {
    const created = await createExport(
      owner,
      projectId,
      uniqueKey("same-org-other")
    );

    const res = await request(app.getHttpServer())
      .get(`${API_PREFIX}/exports/${created.id}`)
      .set(authHeaders(sameOrgMember, owner.orgId))
      .expect(404);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.EXPORT_NOT_FOUND);
  });

  it("returns 400 when Idempotency-Key is missing", async () => {
    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/exports`)
      .set(authHeaders(owner))
      .send({ projectId })
      .expect(400);

    const body = res.body as ApiValidationErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(body.error.fields[IDEMPOTENCY_KEY_HEADER]).toEqual([
      { message: "Idempotency-Key header is required" },
    ]);
  });

  it("does not create a second row for an idempotent POST", async () => {
    const key = uniqueKey("idempotent");
    const first = await createExport(owner, projectId, key);
    const second = await createExport(owner, projectId, key);

    expect(second.id).toBe(first.id);

    const tenantContext = app.get(TenantContextService);
    const database = app.get(DatabaseService);
    const count = await tenantContext.runWithTenantContext(
      { orgId: owner.orgId, userId: owner.userId },
      () =>
        database.client.exportJob.count({
          where: {
            idempotencyKey: key,
            requestedById: owner.userId,
          },
        })
    );

    expect(count).toBe(1);
  });

  it("allows a viewer to POST an export", async () => {
    const created = await createExport(
      viewer,
      projectId,
      uniqueKey("viewer"),
      owner.orgId
    );

    expect(created.id).toBeDefined();
    expect(created.downloadUrl).toBeNull();
    expect(created.status).toBe(ExportJobStatus.QUEUED);
  });

  it("returns 429 when the org is over the monthly export quota", async () => {
    const limit = PLAN_LIMITS[PlanTier.FREE].exportsPerMonth;
    if (limit === null) {
      throw new Error("expected a finite Free plan export quota");
    }

    const tenantContext = app.get(TenantContextService);
    const database = app.get(DatabaseService);

    await tenantContext.runWithTenantContext(
      { orgId: quotaOwner.orgId, userId: quotaOwner.userId },
      () =>
        database.client.exportJob.createMany({
          data: Array.from({ length: limit }, (_, index) => ({
            idempotencyKey: `quota-seed-${index}`,
            organizationId: quotaOwner.orgId,
            projectId: quotaProjectId,
            requestedById: quotaOwner.userId,
          })),
        })
    );

    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/exports`)
      .set(authHeaders(quotaOwner))
      .set(IDEMPOTENCY_KEY_HEADER, uniqueKey("quota-over"))
      .send({ projectId: quotaProjectId })
      .expect(429);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.EXPORT_QUOTA_EXCEEDED);
  });

  it(
    "produces a CSV with comma/newline quoting and an injection prefix",
    async () => {
      const created = await createExport(owner, projectId, uniqueKey("csv"));
      const job = await pollUntilTerminal(owner, created.id);

      expect(job.status).toBe(ExportJobStatus.SUCCEEDED);
      expect(job.downloadUrl).toEqual(expect.any(String));
      expect(job.error).toBeNull();
      expect(job.expiresAt).toEqual(expect.any(String));

      const csvRes = await fetch(job.downloadUrl as string);
      expect(csvRes.ok).toBe(true);

      const csv = await csvRes.text();
      expect(csv.startsWith("\uFEFF")).toBe(false);
      expect(csv).toContain(
        "key,title,description,status,priority,assignee,project,created_at,updated_at"
      );
      expect(csv).toContain(`${projectKey}-${issueNumber}`);
      expect(csv).toContain(`'${CSV_INJECTION_TITLE}`);
      expect(csv).toContain('"hello, ""world""\nnext"');
      expect(csv).toContain(projectName);
    },
    POLL_TIMEOUT_MS
  );

  function authHeaders(user: RegisteredUser, orgId = user.orgId) {
    return {
      Authorization: `Bearer ${user.accessToken}`,
      [AUTH_CONSTANTS.ORG_ID_HEADER]: orgId,
    };
  }

  async function createExport(
    user: RegisteredUser,
    exportProjectId: string,
    idempotencyKey: string,
    orgId = user.orgId
  ): Promise<ExportJobResponseWire> {
    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/exports`)
      .set(authHeaders(user, orgId))
      .set(IDEMPOTENCY_KEY_HEADER, idempotencyKey)
      .send({ projectId: exportProjectId })
      .expect(202);

    const body = res.body as ApiSuccessResponseWire<ExportJobResponseWire>;
    expect(body.data.downloadUrl).toBeNull();
    return body.data;
  }

  async function pollUntilTerminal(
    user: RegisteredUser,
    id: string
  ): Promise<ExportJobResponseWire> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const res = await request(app.getHttpServer())
        .get(`${API_PREFIX}/exports/${id}`)
        .set(authHeaders(user))
        .expect(200);

      const body = res.body as ApiSuccessResponseWire<ExportJobResponseWire>;
      if (
        body.data.status === ExportJobStatus.SUCCEEDED ||
        body.data.status === ExportJobStatus.FAILED
      ) {
        return body.data;
      }

      await sleep(POLL_INTERVAL_MS);
    }

    throw new Error(`Export ${id} did not reach a terminal status in time`);
  }
});

function uniqueKey(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
