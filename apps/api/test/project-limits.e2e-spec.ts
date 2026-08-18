import type { INestApplication } from "@nestjs/common";
import type {
  ApiGeneralErrorResponseWire,
  ProjectResponseWire,
} from "@rivet/shared/api";
import { PLAN_LIMITS } from "@rivet/shared/constants";
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
import { createProject } from "./helpers/fixtures/project";

describe("Project plan limits (e2e)", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("rejects a fourth Free-plan project with 429, including after archive", async () => {
    const owner = await registerLoginAndGetOrg(
      app,
      "project-cap",
      "Project Cap Org"
    );
    const limit = PLAN_LIMITS[PlanTier.FREE].projects;
    if (limit === null) {
      throw new Error("expected a finite Free plan project limit");
    }

    const created: ProjectResponseWire[] = [];
    for (let index = 0; index < limit; index += 1) {
      created.push(
        await createProject(app, owner.accessToken, owner.orgId, {
          description: `Project ${index}`,
          key: `P${index}`,
          name: `Project ${index}`,
        })
      );
    }

    await expectProjectLimitExceeded(owner);

    const firstId = created[0]?.id;
    if (!firstId) {
      throw new Error("expected a created project");
    }

    await request(app.getHttpServer())
      .patch(`${API_PREFIX}/projects/${firstId}/archive`)
      .set(authHeaders(owner))
      .expect(200);

    await expectProjectLimitExceeded(owner);
  }, 60_000);

  it("does not cap Team plan projects", async () => {
    const owner = await registerLoginAndGetOrg(
      app,
      "project-team",
      "Project Team Org"
    );
    const database = app.get(DatabaseService);
    const freeLimit = PLAN_LIMITS[PlanTier.FREE].projects;
    if (freeLimit === null) {
      throw new Error("expected a finite Free plan project limit");
    }

    await database.client.organization.update({
      where: { id: owner.orgId },
      data: { planTier: PlanTier.TEAM },
    });

    for (let index = 0; index < freeLimit + 1; index += 1) {
      await createProject(app, owner.accessToken, owner.orgId, {
        description: `Team project ${index}`,
        key: `T${index}`,
        name: `Team project ${index}`,
      });
    }
  }, 60_000);

  function authHeaders(user: RegisteredUser) {
    return {
      Authorization: `Bearer ${user.accessToken}`,
      [AUTH_CONSTANTS.ORG_ID_HEADER]: user.orgId,
    };
  }

  async function expectProjectLimitExceeded(
    owner: RegisteredUser
  ): Promise<void> {
    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/projects`)
      .set(authHeaders(owner))
      .send({
        description: "Over cap",
        key: "OVER",
        name: "Over cap",
      })
      .expect(429);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.ORG_PROJECT_LIMIT_EXCEEDED);
  }
});
