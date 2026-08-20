import { randomUUID } from "node:crypto";

import type { INestApplication } from "@nestjs/common";
import type {
  ApiGeneralErrorResponseWire,
  ApiPaginatedSuccessResponseWire,
  ApiSuccessResponseWire,
  IssueCommentResponseWire,
} from "@rivet/shared/api";
import { COMMENT_BODY_MAX_LENGTH } from "@rivet/shared/constants";
import { ErrorCode } from "@rivet/shared/enums";
import request from "supertest";
import type { App } from "supertest/types";

import { COMMENT_RATE_LIMIT_MAX } from "@/api/issue/issue.constants";
import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

import { API_PREFIX } from "./helpers/constants";
import { createE2eApp } from "./helpers/e2e-app.helper";
import { registerLoginAndGetOrg } from "./helpers/fixtures/auth";
import { createIssueComment } from "./helpers/fixtures/comment";
import { createIssue } from "./helpers/fixtures/issue";
import { createProject } from "./helpers/fixtures/project";

describe("Issue comments (e2e)", () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let orgId: string;
  let projectId: string;
  let issueId: string;

  beforeAll(async () => {
    app = await createE2eApp();

    const user = await registerLoginAndGetOrg(
      app,
      "issue-comments",
      "Issue Comments Org"
    );
    accessToken = user.accessToken;
    orgId = user.orgId;

    const project = await createProject(app, accessToken, orgId, {
      description: "Comments fixture project",
      key: `CM${Date.now().toString(36).slice(-4).toUpperCase()}`.slice(0, 10),
      name: `Comments ${Date.now()}`,
    });
    projectId = project.id;

    const issue = await createIssue(app, accessToken, orgId, {
      projectId,
      title: "Comments fixture issue",
    });
    issueId = issue.id;
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  function auth() {
    return {
      Authorization: `Bearer ${accessToken}`,
      [AUTH_CONSTANTS.ORG_ID_HEADER]: orgId,
    };
  }

  it("creates, lists, updates, and deletes a comment", async () => {
    const created = await createIssueComment(
      app,
      accessToken,
      orgId,
      issueId,
      "First comment"
    );

    expect(created.body).toBe("First comment");
    expect(created.author).not.toBeNull();
    expect(created.author?.firstName).toBe("Test");
    expect(created.author?.lastName).toBe("User");
    expect(typeof created.author?.id).toBe("string");

    const listed = await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${issueId}/comments`)
      .set(auth())
      .expect(200);

    const listedBody =
      listed.body as ApiPaginatedSuccessResponseWire<IssueCommentResponseWire>;
    expect(listedBody.data.some((comment) => comment.id === created.id)).toBe(
      true
    );

    const updated = await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issueId}/comments/${created.id}`)
      .set(auth())
      .send({ body: "Edited comment" })
      .expect(200);

    const updatedBody =
      updated.body as ApiSuccessResponseWire<IssueCommentResponseWire>;
    expect(updatedBody.data.body).toBe("Edited comment");
    expect(updatedBody.data.updatedAt).not.toBe(created.updatedAt);

    const deleted = await request(app.getHttpServer())
      .delete(`${API_PREFIX}/issues/${issueId}/comments/${created.id}`)
      .set(auth())
      .expect(200);

    const deletedBody =
      deleted.body as ApiSuccessResponseWire<IssueCommentResponseWire>;
    expect(deletedBody.data.id).toBe(created.id);

    const afterDelete = await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${issueId}/comments`)
      .set(auth())
      .expect(200);

    const afterDeleteBody =
      afterDelete.body as ApiPaginatedSuccessResponseWire<IssueCommentResponseWire>;
    expect(
      afterDeleteBody.data.some((comment) => comment.id === created.id)
    ).toBe(false);
  }, 30_000);

  it("lists comments oldest first and paginates with a cursor", async () => {
    const issue = await createIssue(app, accessToken, orgId, {
      projectId,
      title: `Comment pagination ${Date.now()}`,
    });

    const first = await createIssueComment(
      app,
      accessToken,
      orgId,
      issue.id,
      "Oldest"
    );
    const second = await createIssueComment(
      app,
      accessToken,
      orgId,
      issue.id,
      "Newest"
    );

    const page1 = await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${issue.id}/comments`)
      .query({ limit: 1 })
      .set(auth())
      .expect(200);

    const page1Body =
      page1.body as ApiPaginatedSuccessResponseWire<IssueCommentResponseWire>;
    expect(page1Body.data).toHaveLength(1);
    expect(page1Body.data[0]?.id).toBe(first.id);
    expect(page1Body.pagination.nextCursor).toEqual(expect.any(String));

    const page2 = await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${issue.id}/comments`)
      .query({ cursor: page1Body.pagination.nextCursor, limit: 1 })
      .set(auth())
      .expect(200);

    const page2Body =
      page2.body as ApiPaginatedSuccessResponseWire<IssueCommentResponseWire>;
    expect(page2Body.data[0]?.id).toBe(second.id);
  }, 30_000);

  it("rejects an empty comment body", async () => {
    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/issues/${issueId}/comments`)
      .set(auth())
      .send({ body: "" })
      .expect(400);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it("rejects a comment body over the max length", async () => {
    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/issues/${issueId}/comments`)
      .set(auth())
      .send({ body: "x".repeat(COMMENT_BODY_MAX_LENGTH + 1) })
      .expect(400);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it("returns 404 for a missing issue or comment", async () => {
    await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${randomUUID()}/comments`)
      .set(auth())
      .expect(404);

    await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issueId}/comments/${randomUUID()}`)
      .set(auth())
      .send({ body: "Nope" })
      .expect(404);
  });

  it("returns 409 when commenting on an archived project", async () => {
    const project = await createProject(app, accessToken, orgId, {
      description: "Archive comments target",
      key: `CA${Date.now().toString(36).slice(-4).toUpperCase()}`.slice(0, 10),
      name: `Comments archive ${Date.now()}`,
    });
    const issue = await createIssue(app, accessToken, orgId, {
      projectId: project.id,
      title: "Issue in soon-archived project",
    });

    await request(app.getHttpServer())
      .patch(`${API_PREFIX}/projects/${project.id}/archive`)
      .set(auth())
      .expect(200);

    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/issues/${issue.id}/comments`)
      .set(auth())
      .send({ body: "Should not land" })
      .expect(409);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.PROJECT_ARCHIVED);
  }, 30_000);

  it("returns 429 when the author exceeds the comment burst limit", async () => {
    const user = await registerLoginAndGetOrg(
      app,
      "comment-burst",
      "Comment Burst Org"
    );
    const project = await createProject(app, user.accessToken, user.orgId, {
      description: "Rate limit comments project",
      key: `RL${Date.now().toString(36).slice(-4).toUpperCase()}`.slice(0, 10),
      name: `Comment burst ${Date.now()}`,
    });
    const issue = await createIssue(app, user.accessToken, user.orgId, {
      projectId: project.id,
      title: `Rate limit comments ${Date.now()}`,
    });

    for (let i = 0; i < COMMENT_RATE_LIMIT_MAX; i += 1) {
      await createIssueComment(
        app,
        user.accessToken,
        user.orgId,
        issue.id,
        `Burst ${i}`
      );
    }

    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/issues/${issue.id}/comments`)
      .set("Authorization", `Bearer ${user.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, user.orgId)
      .send({ body: "One too many" })
      .expect(429);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.COMMENT_RATE_LIMIT_EXCEEDED);
  }, 30_000);
});
