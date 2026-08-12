import { createHash } from "node:crypto";

import type { INestApplication } from "@nestjs/common";
import type {
  ApiGeneralErrorResponseWire,
  ApiSuccessResponseWire,
  IssueConflictDetailsWire,
  IssueResponseWire,
} from "@rivet/shared/api";
import { ErrorCode, IssueStatus } from "@rivet/shared/enums";
import request from "supertest";
import type { App } from "supertest/types";

import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

import { API_PREFIX } from "./helpers/constants";
import { createE2eApp } from "./helpers/e2e-app.helper";
import { registerLoginAndGetOrg } from "./helpers/fixtures/auth";
import { createIssue } from "./helpers/fixtures/issue";
import { createProject } from "./helpers/fixtures/project";

function fingerprint(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

describe("Issue field concurrency (e2e)", () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let orgId: string;
  let projectId: string;

  beforeAll(async () => {
    app = await createE2eApp();

    const user = await registerLoginAndGetOrg(
      app,
      "issue-cas",
      "Issue CAS Org"
    );
    accessToken = user.accessToken;
    orgId = user.orgId;

    const project = await createProject(app, accessToken, orgId, {
      description: "Concurrency fixture project",
      key: `CAS${Date.now().toString(36).slice(-4).toUpperCase()}`,
      name: `CAS ${Date.now()}`,
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

  async function seedIssue(title: string, description = "") {
    return createIssue(app, accessToken, orgId, {
      description,
      projectId,
      status: IssueStatus.TODO,
      title,
    });
  }

  it("returns descriptionHash on create and get", async () => {
    const created = await seedIssue("Hash on read", "body");
    expect(created.descriptionHash).toBe(fingerprint("body"));

    const res = await request(app.getHttpServer())
      .get(`${API_PREFIX}/issues/${created.id}`)
      .set(auth())
      .expect(200);

    const body = res.body as ApiSuccessResponseWire<IssueResponseWire>;
    expect(body.data.descriptionHash).toBe(fingerprint("body"));
  });

  it("updates description when the expected hash matches", async () => {
    const issue = await seedIssue("Desc ok", "old");

    const res = await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .send({
        description: "new",
        expectedDescriptionHash: issue.descriptionHash,
      })
      .expect(200);

    const body = res.body as ApiSuccessResponseWire<IssueResponseWire>;
    expect(body.data.description).toBe("new");
    expect(body.data.descriptionHash).toBe(fingerprint("new"));
  });

  it("returns 409 when the description hash is stale", async () => {
    const issue = await seedIssue("Desc stale", "current");

    const res = await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .send({
        description: "attempt",
        expectedDescriptionHash: fingerprint("not-current"),
      })
      .expect(409);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.ISSUE_CONFLICT);
    const details = body.error.details as IssueConflictDetailsWire;
    expect(details.conflicts.description?.current).toBe("current");
    expect(details.conflicts.description?.descriptionHash).toBe(
      fingerprint("current")
    );
  });

  it("updates status when expectedStatus matches an allowed transition", async () => {
    const issue = await seedIssue("Status ok");

    const res = await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .send({
        expectedStatus: IssueStatus.TODO,
        status: IssueStatus.IN_PROGRESS,
      })
      .expect(200);

    const body = res.body as ApiSuccessResponseWire<IssueResponseWire>;
    expect(body.data.status).toBe(IssueStatus.IN_PROGRESS);
  });

  it("returns 409 when expectedStatus is stale", async () => {
    const issue = await seedIssue("Status stale");

    await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .send({
        expectedStatus: IssueStatus.TODO,
        status: IssueStatus.IN_PROGRESS,
      })
      .expect(200);

    const res = await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .send({
        expectedStatus: IssueStatus.TODO,
        status: IssueStatus.IN_REVIEW,
      })
      .expect(409);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.ISSUE_CONFLICT);
    const details = body.error.details as IssueConflictDetailsWire;
    expect(details.conflicts.status?.current).toBe(IssueStatus.IN_PROGRESS);
  });

  it("returns 422 for an illegal status transition on a fresh expected value", async () => {
    const issue = await seedIssue("Illegal transition");

    const res = await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .send({
        expectedStatus: IssueStatus.TODO,
        status: IssueStatus.DONE,
      })
      .expect(422);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.ISSUE_STATUS_TRANSITION);
  });

  it("last-write-wins title without concurrency tokens", async () => {
    const issue = await seedIssue("Original title");

    const res = await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .send({ title: "Renamed" })
      .expect(200);

    const body = res.body as ApiSuccessResponseWire<IssueResponseWire>;
    expect(body.data.title).toBe("Renamed");
  });

  it("requires expectedStatus when status is present", async () => {
    const issue = await seedIssue("Missing expected");

    await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .send({ status: IssueStatus.IN_PROGRESS })
      .expect(400);
  });

  it("returns 409 when expectedAssigneeId is stale", async () => {
    const issue = await seedIssue("Assignee stale");
    const fakeId = "11111111-1111-4111-8111-111111111111";

    const res = await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .send({
        assigneeId: null,
        expectedAssigneeId: fakeId,
      })
      .expect(409);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.ISSUE_CONFLICT);
    const details = body.error.details as IssueConflictDetailsWire;
    expect(details.conflicts.assigneeId?.current).toBeNull();
  });

  it("applies a title change together with a valid status CAS", async () => {
    const issue = await seedIssue("Mixed fields");

    const res = await request(app.getHttpServer())
      .patch(`${API_PREFIX}/issues/${issue.id}`)
      .set(auth())
      .send({
        expectedStatus: IssueStatus.TODO,
        status: IssueStatus.IN_PROGRESS,
        title: "Mixed fields updated",
      })
      .expect(200);

    const body = res.body as ApiSuccessResponseWire<IssueResponseWire>;
    expect(body.data.status).toBe(IssueStatus.IN_PROGRESS);
    expect(body.data.title).toBe("Mixed fields updated");
  });
});
