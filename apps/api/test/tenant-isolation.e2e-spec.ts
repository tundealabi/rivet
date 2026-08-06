import { OrganizationRole } from "@generated/prisma";
import type { INestApplication } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import request from "supertest";
import type { App } from "supertest/types";

import {
  TENANT_CONTEXT_KEYS,
  type TenantContextStore,
} from "@/common/constants/tenant-context.constants";
import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";
import { ProjectService } from "@/modules/project/project.service";

import { createE2eApp } from "./helpers/e2e-app.helper";
import {
  type RegisteredUser,
  registerLoginAndGetOrg,
} from "./helpers/fixtures/auth";
import { createProject } from "./helpers/fixtures/project";

const API_PREFIX = "/api/v1";

describe("Tenant isolation (e2e)", () => {
  let app: INestApplication<App>;
  let orgA: RegisteredUser;
  let orgB: RegisteredUser;
  let orgAProjectId: string;

  beforeAll(async () => {
    app = await createE2eApp();

    orgA = await registerLoginAndGetOrg(app, "tenant-a", "Org Alpha Isolation");
    orgB = await registerLoginAndGetOrg(app, "tenant-b", "Org Beta Isolation");

    const project = await createProject(app, orgA.accessToken, orgA.orgId, {
      description: "Cross-tenant isolation fixture project",
      key: `ISO${Date.now().toString(36).slice(-4).toUpperCase()}`,
      name: `Isolation ${Date.now()}`,
    });

    orgAProjectId = project.id;
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  it("returns 404 when org B tries to read org A project via HTTP", async () => {
    await request(app.getHttpServer())
      .get(`${API_PREFIX}/projects/${orgAProjectId}`)
      .set("Authorization", `Bearer ${orgB.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgB.orgId)
      .expect(404);
  });

  it("returns 404 when org B tries to update org A project via HTTP", async () => {
    await request(app.getHttpServer())
      .patch(`${API_PREFIX}/projects/${orgAProjectId}`)
      .set("Authorization", `Bearer ${orgB.accessToken}`)
      .set(AUTH_CONSTANTS.ORG_ID_HEADER, orgB.orgId)
      .send({ name: "Hijacked" })
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
});
