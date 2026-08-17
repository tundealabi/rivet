import { OrganizationRole } from "@generated/prisma";
import type { INestApplication } from "@nestjs/common";
import type {
  ApiPaginatedSuccessResponseWire,
  ApiSuccessResponseWire,
  IssueCommentResponseWire,
  IssueResponseWire,
  ProjectDetailResponseWire,
  ProjectResponseWire,
} from "@rivet/shared/api";
import { ErrorCode } from "@rivet/shared/enums";
import { ClsService } from "nestjs-cls";
import request from "supertest";
import type { App } from "supertest/types";

import {
  TENANT_CONTEXT_KEYS,
  type TenantContextStore,
} from "@/common/constants/tenant-context.constants";
import { DomainError } from "@/common/errors";
import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";
import { IssueService } from "@/modules/issue/issue.service";
import { ProjectService } from "@/modules/project/project.service";

import { createE2eApp } from "./helpers/e2e-app.helper";
import {
  type RegisteredUser,
  registerLoginAndGetOrg,
} from "./helpers/fixtures/auth";
import { createIssueComment } from "./helpers/fixtures/comment";
import { createIssue } from "./helpers/fixtures/issue";
import { createProject } from "./helpers/fixtures/project";

const API_PREFIX = "/api/v1";

describe("Tenant isolation (e2e)", () => {
  let app: INestApplication<App>;
  let orgA: RegisteredUser;
  let orgB: RegisteredUser;
  let orgAProjectId: string;
  let orgAIssueId: string;
  let orgAIssueTitle: string;
  let orgAProjectName: string;

  beforeAll(async () => {
    app = await createE2eApp();

    orgA = await registerLoginAndGetOrg(app, "tenant-a", "Org Alpha Isolation");
    orgB = await registerLoginAndGetOrg(app, "tenant-b", "Org Beta Isolation");

    orgAProjectName = `Isolation ${Date.now()}`;
    const project = await createProject(app, orgA.accessToken, orgA.orgId, {
      description: "Cross-tenant isolation fixture project",
      key: `ISO${Date.now().toString(36).slice(-4).toUpperCase()}`,
      name: orgAProjectName,
    });

    orgAProjectId = project.id;

    orgAIssueTitle = "Org A only issue";
    const issue = await createIssue(app, orgA.accessToken, orgA.orgId, {
      projectId: orgAProjectId,
      title: orgAIssueTitle,
    });
    orgAIssueId = issue.id;
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  it("allows org A to read its project and returns 404 for org B", async () => {
    const ownerRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/projects/${orgAProjectId}`)
      .set("Authorization", `Bearer ${orgA.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgA.orgId)
      .expect(200);

    const ownerBody =
      ownerRes.body as ApiSuccessResponseWire<ProjectDetailResponseWire>;
    expect(ownerBody.data.id).toBe(orgAProjectId);

    await request(app.getHttpServer())
      .get(`${API_PREFIX}/projects/${orgAProjectId}`)
      .set("Authorization", `Bearer ${orgB.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgB.orgId)
      .expect(404);
  });

  it("allows org A to update its project and returns 404 for org B", async () => {
    orgAProjectName = `${orgAProjectName} updated`;

    const ownerRes = await request(app.getHttpServer())
      .patch(`${API_PREFIX}/projects/${orgAProjectId}`)
      .set("Authorization", `Bearer ${orgA.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgA.orgId)
      .send({ name: orgAProjectName })
      .expect(200);

    const ownerBody =
      ownerRes.body as ApiSuccessResponseWire<ProjectResponseWire>;
    expect(ownerBody.data.id).toBe(orgAProjectId);
    expect(ownerBody.data.name).toBe(orgAProjectName);

    await request(app.getHttpServer())
      .patch(`${API_PREFIX}/projects/${orgAProjectId}`)
      .set("Authorization", `Bearer ${orgB.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgB.orgId)
      .send({ name: "Hijacked" })
      .expect(404);

    const verifyRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/projects/${orgAProjectId}`)
      .set("Authorization", `Bearer ${orgA.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgA.orgId)
      .expect(200);

    const verifyBody =
      verifyRes.body as ApiSuccessResponseWire<ProjectDetailResponseWire>;
    expect(verifyBody.data.name).toBe(orgAProjectName);
  });

  it("allows org A to read its issue and returns 404 for org B", async () => {
    const ownerRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${orgAIssueId}`)
      .set("Authorization", `Bearer ${orgA.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgA.orgId)
      .expect(200);

    const ownerBody =
      ownerRes.body as ApiSuccessResponseWire<IssueResponseWire>;
    expect(ownerBody.data.id).toBe(orgAIssueId);

    await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${orgAIssueId}`)
      .set("Authorization", `Bearer ${orgB.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgB.orgId)
      .expect(404);
  });

  it("allows org A to update its issue and returns 404 for org B", async () => {
    orgAIssueTitle = `${orgAIssueTitle} updated`;

    const ownerRes = await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${orgAIssueId}`)
      .set("Authorization", `Bearer ${orgA.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgA.orgId)
      .send({ title: orgAIssueTitle })
      .expect(200);

    const ownerBody =
      ownerRes.body as ApiSuccessResponseWire<IssueResponseWire>;
    expect(ownerBody.data.id).toBe(orgAIssueId);
    expect(ownerBody.data.title).toBe(orgAIssueTitle);

    await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${orgAIssueId}`)
      .set("Authorization", `Bearer ${orgB.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgB.orgId)
      .send({ title: "Hijacked" })
      .expect(404);

    const verifyRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${orgAIssueId}`)
      .set("Authorization", `Bearer ${orgA.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgA.orgId)
      .expect(200);

    const verifyBody =
      verifyRes.body as ApiSuccessResponseWire<IssueResponseWire>;
    expect(verifyBody.data.title).toBe(orgAIssueTitle);
  });

  it("allows org A to comment on its issue and returns 404 for org B", async () => {
    const created = await createIssueComment(
      app,
      orgA.accessToken,
      orgA.orgId,
      orgAIssueId,
      "Org A only comment"
    );

    const ownerRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${orgAIssueId}/comments`)
      .set("Authorization", `Bearer ${orgA.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgA.orgId)
      .expect(200);

    const ownerBody =
      ownerRes.body as ApiPaginatedSuccessResponseWire<IssueCommentResponseWire>;
    expect(ownerBody.data.some((comment) => comment.id === created.id)).toBe(
      true
    );

    await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${orgAIssueId}/comments`)
      .set("Authorization", `Bearer ${orgB.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgB.orgId)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${orgAIssueId}/comments/${created.id}`)
      .set("Authorization", `Bearer ${orgB.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgB.orgId)
      .send({ body: "Hijacked" })
      .expect(404);

    const verifyRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${orgAIssueId}/comments`)
      .set("Authorization", `Bearer ${orgA.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgA.orgId)
      .expect(200);

    const verifyBody =
      verifyRes.body as ApiPaginatedSuccessResponseWire<IssueCommentResponseWire>;
    const stillThere = verifyBody.data.find(
      (comment) => comment.id === created.id
    );
    expect(stillThere?.body).toBe("Org A only comment");
  });

  it("allows org A to list issues for its project and returns 404 for org B", async () => {
    const ownerRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues`)
      .query({ projectId: orgAProjectId })
      .set("Authorization", `Bearer ${orgA.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgA.orgId)
      .expect(200);

    const ownerBody =
      ownerRes.body as ApiPaginatedSuccessResponseWire<IssueResponseWire>;
    expect(ownerBody.data.some((issue) => issue.id === orgAIssueId)).toBe(true);

    await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues`)
      .query({ projectId: orgAProjectId })
      .set("Authorization", `Bearer ${orgB.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgB.orgId)
      .expect(404);
  });

  it("does not return org A project when orgId is omitted from module queries", async () => {
    const cls = app.get(ClsService<TenantContextStore>);
    const projectService = app.get(ProjectService);

    await cls.run(async () => {
      cls.set(TENANT_CONTEXT_KEYS.orgId, orgA.orgId);
      cls.set(TENANT_CONTEXT_KEYS.userId, "test-user-a");
      cls.set(TENANT_CONTEXT_KEYS.orgRole, OrganizationRole.OWNER);

      const found = await projectService.findById({ id: orgAProjectId });
      expect(found).not.toBeNull();
      expect(found?.id).toBe(orgAProjectId);

      orgAProjectName = `${orgAProjectName} module`;
      const updated = await projectService.update(orgAProjectId, {
        name: orgAProjectName,
      });
      expect(updated).not.toBeNull();
      expect(updated?.name).toBe(orgAProjectName);
    });

    await cls.run(async () => {
      cls.set(TENANT_CONTEXT_KEYS.orgId, orgB.orgId);
      cls.set(TENANT_CONTEXT_KEYS.userId, "test-user-b");
      cls.set(TENANT_CONTEXT_KEYS.orgRole, OrganizationRole.OWNER);

      const found = await projectService.findById({ id: orgAProjectId });
      expect(found).toBeNull();

      const updated = await projectService.update(orgAProjectId, {
        name: "Cross-tenant update attempt",
      });
      expect(updated).toBeNull();
    });
  });

  it("does not return org A issue when orgId is omitted from module queries", async () => {
    const cls = app.get(ClsService<TenantContextStore>);
    const issueService = app.get(IssueService);

    await cls.run(async () => {
      cls.set(TENANT_CONTEXT_KEYS.orgId, orgA.orgId);
      cls.set(TENANT_CONTEXT_KEYS.userId, "test-user-a");
      cls.set(TENANT_CONTEXT_KEYS.orgRole, OrganizationRole.OWNER);

      const found = await issueService.findById({ id: orgAIssueId });
      expect(found).not.toBeNull();
      expect(found?.id).toBe(orgAIssueId);

      orgAIssueTitle = `${orgAIssueTitle} module`;
      const updated = await issueService.update({
        id: orgAIssueId,
        title: orgAIssueTitle,
      });
      expect(updated.title).toBe(orgAIssueTitle);
    });

    await cls.run(async () => {
      cls.set(TENANT_CONTEXT_KEYS.orgId, orgB.orgId);
      cls.set(TENANT_CONTEXT_KEYS.userId, "test-user-b");
      cls.set(TENANT_CONTEXT_KEYS.orgRole, OrganizationRole.OWNER);

      const found = await issueService.findById({ id: orgAIssueId });
      expect(found).toBeNull();

      await expect(
        issueService.update({
          id: orgAIssueId,
          title: "Cross-tenant update attempt",
        })
      ).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
        kind: "NOT_FOUND",
        name: DomainError.name,
      });
    });
  });

  it("does not return org A comments when orgId is omitted from module queries", async () => {
    const created = await createIssueComment(
      app,
      orgA.accessToken,
      orgA.orgId,
      orgAIssueId,
      "Module isolation comment"
    );

    const cls = app.get(ClsService<TenantContextStore>);
    const issueService = app.get(IssueService);

    await cls.run(async () => {
      cls.set(TENANT_CONTEXT_KEYS.orgId, orgA.orgId);
      cls.set(TENANT_CONTEXT_KEYS.userId, "test-user-a");
      cls.set(TENANT_CONTEXT_KEYS.orgRole, OrganizationRole.OWNER);

      const found = await issueService.findCommentById({
        id: created.id,
        issueId: orgAIssueId,
      });
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });

    await cls.run(async () => {
      cls.set(TENANT_CONTEXT_KEYS.orgId, orgB.orgId);
      cls.set(TENANT_CONTEXT_KEYS.userId, "test-user-b");
      cls.set(TENANT_CONTEXT_KEYS.orgRole, OrganizationRole.OWNER);

      const found = await issueService.findCommentById({
        id: created.id,
        issueId: orgAIssueId,
      });
      expect(found).toBeNull();

      await expect(
        issueService.updateComment({
          body: "Cross-tenant update attempt",
          id: created.id,
          issueId: orgAIssueId,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
        kind: "NOT_FOUND",
        name: DomainError.name,
      });
    });
  });
});
