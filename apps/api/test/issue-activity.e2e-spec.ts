import type { INestApplication } from "@nestjs/common";
import type {
  ApiPaginatedSuccessResponseWire,
  ApiSuccessResponseWire,
  IssueActivityResponseWire,
  IssueResponseWire,
} from "@rivet/shared/api";
import { IssueActivityField, IssueStatus } from "@rivet/shared/enums";
import request from "supertest";
import type { App } from "supertest/types";

import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

import { API_PREFIX } from "./helpers/constants";
import { createE2eApp } from "./helpers/e2e-app.helper";
import { registerLoginAndGetOrg } from "./helpers/fixtures/auth";
import { createIssue } from "./helpers/fixtures/issue";
import { createProject } from "./helpers/fixtures/project";

describe("Issue activity and delete (e2e)", () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let orgId: string;
  let projectId: string;

  beforeAll(async () => {
    app = await createE2eApp();

    const user = await registerLoginAndGetOrg(
      app,
      "issue-activity",
      "Issue Activity Org"
    );
    accessToken = user.accessToken;
    orgId = user.orgId;

    const project = await createProject(app, accessToken, orgId, {
      description: "Activity fixture project",
      key: `ACT${Date.now().toString(36).slice(-4).toUpperCase()}`.slice(0, 10),
      name: `Activity ${Date.now()}`,
    });
    projectId = project.id;
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

  it("lists field-change activity newest first after a PATCH", async () => {
    const issue = await createIssue(app, accessToken, orgId, {
      projectId,
      title: "Activity fixture",
    });

    await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .send({ title: "Activity fixture renamed" })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .send({
        expectedStatus: IssueStatus.TODO,
        status: IssueStatus.IN_PROGRESS,
      })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${issue.id}/activity`)
      .set(auth())
      .expect(200);

    const body =
      res.body as ApiPaginatedSuccessResponseWire<IssueActivityResponseWire>;
    expect(body.data).toHaveLength(2);
    expect(body.data[0]?.field).toBe(IssueActivityField.STATUS);
    expect(body.data[0]?.fromValue).toBe(IssueStatus.TODO);
    expect(body.data[0]?.toValue).toBe(IssueStatus.IN_PROGRESS);
    expect(body.data[1]?.field).toBe(IssueActivityField.TITLE);
    expect(body.data[1]?.fromValue).toBe("Activity fixture");
    expect(body.data[1]?.toValue).toBe("Activity fixture renamed");
    expect(body.data[0]?.actor?.firstName).toBe("Test");
  }, 15_000);

  it("deletes an issue and returns 404 on subsequent GET", async () => {
    const issue = await createIssue(app, accessToken, orgId, {
      projectId,
      title: "Issue to remove",
    });

    const deleted = await request(app.getHttpServer())
      .delete(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .expect(200);

    const deletedBody =
      deleted.body as ApiSuccessResponseWire<IssueResponseWire>;
    expect(deletedBody.data.id).toBe(issue.id);

    await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .expect(404);

    await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${issue.id}/activity`)
      .set(auth())
      .expect(404);
  }, 15_000);

  it("returns 409 when deleting an issue in an archived project", async () => {
    const project = await createProject(app, accessToken, orgId, {
      description: "Archive then delete issue",
      key: `AD${Date.now().toString(36).slice(-4).toUpperCase()}`.slice(0, 10),
      name: `Archive delete ${Date.now()}`,
    });
    const issue = await createIssue(app, accessToken, orgId, {
      projectId: project.id,
      title: "Stuck in archive",
    });

    await request(app.getHttpServer())
      .patch(`${API_PREFIX}/projects/${project.id}/archive`)
      .set(auth())
      .expect(200);

    await request(app.getHttpServer())
      .delete(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .expect(409);
  }, 15_000);
});
