import { OrganizationRole } from "@generated/prisma";
import type { INestApplication } from "@nestjs/common";
import type {
  ApiGeneralErrorResponseWire,
  ApiSuccessResponseWire,
  IssueResponseWire,
  ProjectDetailResponseWire,
  ProjectResponseWire,
} from "@rivet/shared/api";
import { IDEMPOTENCY_KEY_HEADER } from "@rivet/shared/constants";
import { ErrorCode } from "@rivet/shared/enums";
import request from "supertest";
import type { App } from "supertest/types";

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

describe("RBAC (e2e)", () => {
  let app: INestApplication<App>;
  let owner: RegisteredUser;
  let admin: RegisteredUser;
  let member: RegisteredUser;
  let viewer: RegisteredUser;
  let projectId: string;
  let issueId: string;

  beforeAll(async () => {
    app = await createE2eApp();

    owner = await registerLoginAndGetOrg(app, "rbac-owner", "RBAC Org");
    admin = await registerLoginAndGetOrg(app, "rbac-admin", "RBAC Admin Own");
    member = await registerLoginAndGetOrg(
      app,
      "rbac-member",
      "RBAC Member Own"
    );
    viewer = await registerLoginAndGetOrg(
      app,
      "rbac-viewer",
      "RBAC Viewer Own"
    );

    await addOrgMember(app, {
      orgId: owner.orgId,
      role: OrganizationRole.ADMIN,
      userId: admin.userId,
    });
    await addOrgMember(app, {
      orgId: owner.orgId,
      role: OrganizationRole.MEMBER,
      userId: member.userId,
    });
    await addOrgMember(app, {
      orgId: owner.orgId,
      role: OrganizationRole.VIEWER,
      userId: viewer.userId,
    });

    const stamp = Date.now().toString(36).slice(-4).toUpperCase();
    const project = await createProject(app, owner.accessToken, owner.orgId, {
      description: "RBAC fixture project created by owner",
      key: `RB${stamp}`.slice(0, 10),
      name: `RBAC ${Date.now()}`,
    });
    projectId = project.id;

    const issue = await createIssue(app, owner.accessToken, owner.orgId, {
      projectId,
      title: "RBAC fixture issue",
    });
    issueId = issue.id;
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  describe("reads", () => {
    it("lets a viewer list and get projects, issues, and members", async () => {
      await request(app.getHttpServer())
        .get(`${API_PREFIX}/projects`)
        .set(authHeaders(viewer))
        .expect(200);

      const projectRes = await request(app.getHttpServer())
        .get(`${API_PREFIX}/projects/${projectId}`)
        .set(authHeaders(viewer))
        .expect(200);

      const projectBody =
        projectRes.body as ApiSuccessResponseWire<ProjectDetailResponseWire>;
      expect(projectBody.data.id).toBe(projectId);

      await request(app.getHttpServer())
        .get(`${API_PREFIX}/issues`)
        .query({ projectId })
        .set(authHeaders(viewer))
        .expect(200);

      const issueRes = await request(app.getHttpServer())
        .get(`${API_PREFIX}/issues/${issueId}`)
        .set(authHeaders(viewer))
        .expect(200);

      const issueBody =
        issueRes.body as ApiSuccessResponseWire<IssueResponseWire>;
      expect(issueBody.data.id).toBe(issueId);

      await request(app.getHttpServer())
        .get(`${API_PREFIX}/organizations/members`)
        .set(authHeaders(viewer))
        .expect(200);
    });
  });

  describe("projects", () => {
    it("forbids a viewer from creating a project", async () => {
      await expectForbidden(
        request(app.getHttpServer())
          .post(`${API_PREFIX}/projects`)
          .set(authHeaders(viewer))
          .send({
            description: "Viewer should not create this",
            key: uniqueProjectKey("VW"),
            name: `Viewer project ${Date.now()}`,
          })
      );
    });

    it("lets a member create a project", async () => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/projects`)
        .set(authHeaders(member))
        .send({
          description: "Member-created project",
          key: uniqueProjectKey("MB"),
          name: `Member project ${Date.now()}`,
        })
        .expect(201);

      const body = res.body as ApiSuccessResponseWire<ProjectResponseWire>;
      expect(body.data.id).toBeDefined();
    });

    it("forbids a member from updating a project", async () => {
      await expectForbidden(
        request(app.getHttpServer())
          .patch(`${API_PREFIX}/projects/${projectId}`)
          .set(authHeaders(member))
          .send({ description: "Hijacked by member" })
      );
    });

    it("lets an admin update a project", async () => {
      const description = `Updated by admin ${Date.now()}`;
      const res = await request(app.getHttpServer())
        .patch(`${API_PREFIX}/projects/${projectId}`)
        .set(authHeaders(admin))
        .send({ description })
        .expect(200);

      const body = res.body as ApiSuccessResponseWire<ProjectResponseWire>;
      expect(body.data.description).toBe(description);
    });

    it("lets an admin archive a project they did not create, and forbids a member", async () => {
      const stamp = Date.now().toString(36).slice(-4).toUpperCase();
      const project = await createProject(app, owner.accessToken, owner.orgId, {
        description: "Archive target created by owner",
        key: `AR${stamp}`.slice(0, 10),
        name: `RBAC archive ${Date.now()}`,
      });

      await expectForbidden(
        request(app.getHttpServer())
          .patch(`${API_PREFIX}/projects/${project.id}/archive`)
          .set(authHeaders(member))
      );

      const archived = await request(app.getHttpServer())
        .patch(`${API_PREFIX}/projects/${project.id}/archive`)
        .set(authHeaders(admin))
        .expect(200);

      const archivedBody =
        archived.body as ApiSuccessResponseWire<ProjectResponseWire>;
      expect(archivedBody.data.archivedAt).toEqual(expect.any(String));

      await expectForbidden(
        request(app.getHttpServer())
          .patch(`${API_PREFIX}/projects/${project.id}/unarchive`)
          .set(authHeaders(member))
      );

      const unarchived = await request(app.getHttpServer())
        .patch(`${API_PREFIX}/projects/${project.id}/unarchive`)
        .set(authHeaders(admin))
        .expect(200);

      const unarchivedBody =
        unarchived.body as ApiSuccessResponseWire<ProjectResponseWire>;
      expect(unarchivedBody.data.archivedAt).toBeNull();
    });
  });

  describe("issues", () => {
    it("forbids a viewer from creating or updating an issue", async () => {
      await expectForbidden(
        request(app.getHttpServer())
          .post(`${API_PREFIX}/issues`)
          .set(authHeaders(viewer))
          .send({
            projectId,
            title: "Viewer should not create this",
          })
      );

      await expectForbidden(
        request(app.getHttpServer())
          .patch(`${API_PREFIX}/issues/${issueId}`)
          .set(authHeaders(viewer))
          .send({ title: "Hijacked by viewer" })
      );
    });

    it("lets a member create and update an issue", async () => {
      const created = await request(app.getHttpServer())
        .post(`${API_PREFIX}/issues`)
        .set(authHeaders(member))
        .send({
          projectId,
          title: "Member-created issue",
        })
        .expect(201);

      const createdBody =
        created.body as ApiSuccessResponseWire<IssueResponseWire>;
      expect(createdBody.data.id).toBeDefined();

      const updatedTitle = `Updated by member ${Date.now()}`;
      const updated = await request(app.getHttpServer())
        .patch(`${API_PREFIX}/issues/${createdBody.data.id}`)
        .set(authHeaders(member))
        .send({ title: updatedTitle })
        .expect(200);

      const updatedBody =
        updated.body as ApiSuccessResponseWire<IssueResponseWire>;
      expect(updatedBody.data.title).toBe(updatedTitle);
    });
  });

  describe("exports", () => {
    it("forbids a viewer from creating an export", async () => {
      await expectForbidden(
        request(app.getHttpServer())
          .post(`${API_PREFIX}/exports`)
          .set(authHeaders(viewer))
          .set(IDEMPOTENCY_KEY_HEADER, `rbac-viewer-${Date.now()}`)
          .send({ projectId })
      );
    });
  });

  function authHeaders(user: RegisteredUser) {
    return {
      Authorization: `Bearer ${user.accessToken}`,
      [AUTH_CONSTANTS.ORG_ID_HEADER]: owner.orgId,
    };
  }

  async function expectForbidden(req: request.Test): Promise<void> {
    const res = await req.expect(403);
    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.FORBIDDEN);
  }

  function uniqueProjectKey(prefix: string): string {
    const stamp = Date.now().toString(36).slice(-4).toUpperCase();
    return `${prefix}${stamp}`.slice(0, 10);
  }
});
