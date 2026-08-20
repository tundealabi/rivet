import type { INestApplication } from "@nestjs/common";
import type {
  ApiGeneralErrorResponseWire,
  ApiSuccessResponseWire,
  UserOrganizationResponseWire,
} from "@rivet/shared/api";
import { ErrorCode, OrganizationRole } from "@rivet/shared/enums";
import request from "supertest";
import type { App } from "supertest/types";

import { API_PREFIX } from "./helpers/constants";
import { createE2eApp } from "./helpers/e2e-app.helper";
import {
  type RegisteredUser,
  registerLoginAndGetOrg,
} from "./helpers/fixtures/auth";

describe("Create organization (e2e)", () => {
  let app: INestApplication<App>;
  let user: RegisteredUser;

  beforeAll(async () => {
    app = await createE2eApp();
    user = await registerLoginAndGetOrg(
      app,
      "create-org",
      "Create Org First Workspace"
    );
  }, 60_000);

  afterAll(async () => {
    await app.close();
  }, 15_000);

  it("lets an authenticated user create a second organization", async () => {
    const secondName = "Create Org Second Workspace";

    const createRes = await request(app.getHttpServer())
      .post(`${API_PREFIX}/organizations`)
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ name: `  ${secondName}  ` })
      .expect(201);

    const createBody =
      createRes.body as ApiSuccessResponseWire<UserOrganizationResponseWire>;
    const created = createBody.data;
    expect(created.memberCount).toBe(1);
    expect(created.orgName).toBe(secondName);
    expect(created.role).toBe(OrganizationRole.OWNER);
    expect(created.orgId).toEqual(expect.any(String));
    expect(created.orgId).not.toBe(user.orgId);

    const listRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/organizations`)
      .set("Authorization", `Bearer ${user.accessToken}`)
      .expect(200);

    const listBody = listRes.body as ApiSuccessResponseWire<
      UserOrganizationResponseWire[]
    >;
    const orgIds = listBody.data.map((org) => org.orgId);
    const orgNames = listBody.data.map((org) => org.orgName);

    expect(orgIds).toEqual(expect.arrayContaining([user.orgId, created.orgId]));
    expect(orgNames).toEqual(
      expect.arrayContaining(["Create Org First Workspace", secondName])
    );
    expect(listBody.data.find((org) => org.orgId === user.orgId)?.role).toBe(
      OrganizationRole.OWNER
    );
    expect(listBody.data.find((org) => org.orgId === created.orgId)?.role).toBe(
      OrganizationRole.OWNER
    );
  });

  it("rejects unauthenticated create with 401", async () => {
    await request(app.getHttpServer())
      .post(`${API_PREFIX}/organizations`)
      .send({ name: "Unauthenticated Org" })
      .expect(401);
  });

  it("rejects a name shorter than 3 characters", async () => {
    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/organizations`)
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ name: "ab" })
      .expect(400);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });
});
