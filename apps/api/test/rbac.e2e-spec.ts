import { OrganizationRole } from "@generated/prisma";
import type { INestApplication } from "@nestjs/common";
import type {
  ApiGeneralErrorResponseWire,
  ApiPaginatedSuccessResponseWire,
  ApiSuccessResponseWire,
  IssueCommentResponseWire,
  IssueResponseWire,
  ProjectDetailResponseWire,
  ProjectResponseWire,
} from "@rivet/shared/api";
import { IDEMPOTENCY_KEY_HEADER } from "@rivet/shared/constants";
import { ErrorCode, PlanTier } from "@rivet/shared/enums";
import request from "supertest";
import type { App } from "supertest/types";

import { DatabaseService } from "@/database/database.service";
import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

import { API_PREFIX } from "./helpers/constants";
import { createE2eApp } from "./helpers/e2e-app.helper";
import {
  type RegisteredUser,
  registerLoginAndGetOrg,
} from "./helpers/fixtures/auth";
import { createIssueComment } from "./helpers/fixtures/comment";
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

    const database = app.get(DatabaseService);
    await database.client.organization.update({
      where: { id: owner.orgId },
      data: { planTier: PlanTier.TEAM },
    });

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

    it("lets an admin delete a project they did not create, and forbids a member", async () => {
      const stamp = Date.now().toString(36).slice(-4).toUpperCase();
      const project = await createProject(app, owner.accessToken, owner.orgId, {
        description: "Delete target created by owner",
        key: `DL${stamp}`.slice(0, 10),
        name: `RBAC delete ${Date.now()}`,
      });

      await expectForbidden(
        request(app.getHttpServer())
          .delete(`${API_PREFIX}/projects/${project.id}`)
          .set(authHeaders(member))
      );

      await request(app.getHttpServer())
        .delete(`${API_PREFIX}/projects/${project.id}`)
        .set(authHeaders(admin))
        .expect(200);

      await request(app.getHttpServer())
        .get(`${API_PREFIX}/projects/${project.id}`)
        .set(authHeaders(admin))
        .expect(404);
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

    it("lets a member delete an issue and forbids a viewer", async () => {
      const created = await createIssue(app, owner.accessToken, owner.orgId, {
        projectId,
        title: "Issue to delete",
      });

      await expectForbidden(
        request(app.getHttpServer())
          .delete(`${API_PREFIX}/issues/${created.id}`)
          .set(authHeaders(viewer))
      );

      await request(app.getHttpServer())
        .delete(`${API_PREFIX}/issues/${created.id}`)
        .set(authHeaders(member))
        .expect(200);

      await request(app.getHttpServer())
        .get(`${API_PREFIX}/issues/${created.id}`)
        .set(authHeaders(member))
        .expect(404);
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

  describe("comments", () => {
    it("lets a viewer list comments and forbids create, edit, and delete", async () => {
      const created = await createIssueComment(
        app,
        owner.accessToken,
        owner.orgId,
        issueId,
        "Owner comment"
      );

      const listed = await request(app.getHttpServer())
        .get(`${API_PREFIX}/issues/${issueId}/comments`)
        .set(authHeaders(viewer))
        .expect(200);

      const listedBody =
        listed.body as ApiPaginatedSuccessResponseWire<IssueCommentResponseWire>;
      expect(listedBody.data.some((comment) => comment.id === created.id)).toBe(
        true
      );

      await expectForbidden(
        request(app.getHttpServer())
          .post(`${API_PREFIX}/issues/${issueId}/comments`)
          .set(authHeaders(viewer))
          .send({ body: "Viewer should not comment" })
      );

      await expectForbidden(
        request(app.getHttpServer())
          .patch(`${API_PREFIX}/issues/${issueId}/comments/${created.id}`)
          .set(authHeaders(viewer))
          .send({ body: "Hijacked by viewer" })
      );

      await expectForbidden(
        request(app.getHttpServer())
          .delete(`${API_PREFIX}/issues/${issueId}/comments/${created.id}`)
          .set(authHeaders(viewer))
      );
    }, 30_000);

    it("lets a member create and edit their own comment, but not another member's", async () => {
      const ownerComment = await createIssueComment(
        app,
        owner.accessToken,
        owner.orgId,
        issueId,
        "Owner-authored comment"
      );

      const created = await request(app.getHttpServer())
        .post(`${API_PREFIX}/issues/${issueId}/comments`)
        .set(authHeaders(member))
        .send({ body: "Member comment" })
        .expect(201);

      const createdBody =
        created.body as ApiSuccessResponseWire<IssueCommentResponseWire>;
      expect(createdBody.data.body).toBe("Member comment");

      const updated = await request(app.getHttpServer())
        .patch(
          `${API_PREFIX}/issues/${issueId}/comments/${createdBody.data.id}`
        )
        .set(authHeaders(member))
        .send({ body: "Member edited" })
        .expect(200);

      const updatedBody =
        updated.body as ApiSuccessResponseWire<IssueCommentResponseWire>;
      expect(updatedBody.data.body).toBe("Member edited");

      await expectForbidden(
        request(app.getHttpServer())
          .patch(`${API_PREFIX}/issues/${issueId}/comments/${ownerComment.id}`)
          .set(authHeaders(member))
          .send({ body: "Hijacked by member" })
      );

      await expectForbidden(
        request(app.getHttpServer())
          .delete(`${API_PREFIX}/issues/${issueId}/comments/${ownerComment.id}`)
          .set(authHeaders(member))
      );
    }, 30_000);

    it("lets an admin edit and delete another member's comment", async () => {
      const memberComment = await createIssueComment(
        app,
        member.accessToken,
        owner.orgId,
        issueId,
        "Member comment for admin to moderate"
      );

      const updated = await request(app.getHttpServer())
        .patch(`${API_PREFIX}/issues/${issueId}/comments/${memberComment.id}`)
        .set(authHeaders(admin))
        .send({ body: "Edited by admin" })
        .expect(200);

      const updatedBody =
        updated.body as ApiSuccessResponseWire<IssueCommentResponseWire>;
      expect(updatedBody.data.body).toBe("Edited by admin");

      const deleted = await request(app.getHttpServer())
        .delete(`${API_PREFIX}/issues/${issueId}/comments/${memberComment.id}`)
        .set(authHeaders(admin))
        .expect(200);

      const deletedBody =
        deleted.body as ApiSuccessResponseWire<IssueCommentResponseWire>;
      expect(deletedBody.data.id).toBe(memberComment.id);
    }, 30_000);
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
