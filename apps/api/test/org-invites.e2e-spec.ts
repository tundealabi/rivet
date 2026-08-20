import { OrganizationRole } from "@generated/prisma";
import type { INestApplication } from "@nestjs/common";
import type {
  ApiGeneralErrorResponseWire,
  ApiPaginatedSuccessResponseWire,
  ApiSuccessResponseWire,
  OrganizationInviteCreatedResponseWire,
  OrganizationInviteResponseWire,
  UserOrganizationResponseWire,
} from "@rivet/shared/api";
import { PLAN_LIMITS } from "@rivet/shared/constants";
import {
  ErrorCode,
  OrganizationInviteStatus,
  OrganizationRole as SharedOrganizationRole,
  PlanTier,
} from "@rivet/shared/enums";
import request from "supertest";
import type { App } from "supertest/types";

import { HashService } from "@/common/services";
import { DatabaseService } from "@/database/database.service";
import { AUTH_CONSTANTS } from "@/modules/auth/auth.constants";

import { API_PREFIX } from "./helpers/constants";
import { createE2eApp } from "./helpers/e2e-app.helper";
import {
  type RegisteredUser,
  registerLoginAndGetOrg,
} from "./helpers/fixtures/auth";
import { createOrganizationInvites } from "./helpers/fixtures/org-invite";
import { addOrgMember } from "./helpers/fixtures/org-member";

describe("Organization invites (e2e)", () => {
  let app: INestApplication<App>;
  let owner: RegisteredUser;
  let rbacOwner: RegisteredUser;
  let admin: RegisteredUser;
  let member: RegisteredUser;
  let viewer: RegisteredUser;
  let otherOrg: RegisteredUser;
  let hashService: HashService;
  let database: DatabaseService;

  beforeAll(async () => {
    app = await createE2eApp();
    hashService = app.get(HashService);
    database = app.get(DatabaseService);

    owner = await registerLoginAndGetOrg(
      app,
      "invite-owner",
      "Invite Owner Org"
    );
    rbacOwner = await registerLoginAndGetOrg(
      app,
      "invite-rbac",
      "Invite RBAC Org"
    );
    admin = await registerLoginAndGetOrg(
      app,
      "invite-admin",
      "Invite Admin Own Org"
    );
    member = await registerLoginAndGetOrg(
      app,
      "invite-member",
      "Invite Member Own Org"
    );
    viewer = await registerLoginAndGetOrg(
      app,
      "invite-viewer",
      "Invite Viewer Own Org"
    );
    otherOrg = await registerLoginAndGetOrg(
      app,
      "invite-other",
      "Invite Other Org"
    );

    await addOrgMember(app, {
      orgId: rbacOwner.orgId,
      role: OrganizationRole.ADMIN,
      userId: admin.userId,
    });
    await addOrgMember(app, {
      orgId: rbacOwner.orgId,
      role: OrganizationRole.MEMBER,
      userId: member.userId,
    });
    await addOrgMember(app, {
      orgId: rbacOwner.orgId,
      role: OrganizationRole.VIEWER,
      userId: viewer.userId,
    });
  }, 60_000);

  afterAll(async () => {
    await app.close();
  }, 15_000);

  describe("RBAC", () => {
    it("forbids a viewer from creating, listing, resending, or revoking org invites", async () => {
      await expectForbidden(
        request(app.getHttpServer())
          .post(`${API_PREFIX}/organizations/invites`)
          .set(authHeaders(viewer, rbacOwner.orgId))
          .send({
            emails: [uniqueInviteEmail("viewer-create")],
            role: SharedOrganizationRole.MEMBER,
          })
      );

      await expectForbidden(
        request(app.getHttpServer())
          .get(`${API_PREFIX}/organizations/invites`)
          .set(authHeaders(viewer, rbacOwner.orgId))
      );

      await expectForbidden(
        request(app.getHttpServer())
          .post(
            `${API_PREFIX}/organizations/invites/00000000-0000-4000-8000-000000000000/resend`
          )
          .set(authHeaders(viewer, rbacOwner.orgId))
      );

      await expectForbidden(
        request(app.getHttpServer())
          .delete(
            `${API_PREFIX}/organizations/invites/00000000-0000-4000-8000-000000000000`
          )
          .set(authHeaders(viewer, rbacOwner.orgId))
      );
    });

    it("forbids a member from creating, listing, resending, or revoking org invites", async () => {
      await expectForbidden(
        request(app.getHttpServer())
          .post(`${API_PREFIX}/organizations/invites`)
          .set(authHeaders(member, rbacOwner.orgId))
          .send({
            emails: [uniqueInviteEmail("member-create")],
            role: SharedOrganizationRole.MEMBER,
          })
      );

      await expectForbidden(
        request(app.getHttpServer())
          .get(`${API_PREFIX}/organizations/invites`)
          .set(authHeaders(member, rbacOwner.orgId))
      );

      await expectForbidden(
        request(app.getHttpServer())
          .post(
            `${API_PREFIX}/organizations/invites/00000000-0000-4000-8000-000000000000/resend`
          )
          .set(authHeaders(member, rbacOwner.orgId))
      );

      await expectForbidden(
        request(app.getHttpServer())
          .delete(
            `${API_PREFIX}/organizations/invites/00000000-0000-4000-8000-000000000000`
          )
          .set(authHeaders(member, rbacOwner.orgId))
      );
    });

    it("lets an admin create an invite", async () => {
      const email = uniqueInviteEmail("admin-create");
      const created = await createOrganizationInvites(
        app,
        admin.accessToken,
        rbacOwner.orgId,
        { emails: [email], role: SharedOrganizationRole.MEMBER }
      );

      expect(created).toHaveLength(1);
      expect(created[0]?.email).toBe(email);
      expect(created[0]?.role).toBe(SharedOrganizationRole.MEMBER);
      expect(created[0]?.status).toBe(OrganizationInviteStatus.PENDING);
      expect(created[0]?.token).toEqual(expect.any(String));
      expect(created[0]?.invitedBy).toEqual({
        firstName: "Test",
        id: admin.userId,
        lastName: "User",
      });
    });

    it("lets an owner create an invite", async () => {
      const email = uniqueInviteEmail("owner-create");
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/organizations/invites`)
        .set(authHeaders(owner))
        .send({
          emails: [email],
          role: SharedOrganizationRole.VIEWER,
        })
        .expect(201);

      const body = res.body as ApiSuccessResponseWire<
        OrganizationInviteCreatedResponseWire[]
      >;
      expect(body.data).toHaveLength(1);
      expect(body.data[0]?.email).toBe(email);
      expect(body.data[0]?.token).toEqual(expect.any(String));

      const inviteId = body.data[0]?.id;
      if (!inviteId) {
        throw new Error("expected a created invite");
      }
      await revokeInvite(inviteId);
    });
  });

  it("rejects inviting OWNER with 400", async () => {
    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/organizations/invites`)
      .set(authHeaders(owner))
      .send({
        emails: [uniqueInviteEmail("owner-role")],
        role: SharedOrganizationRole.OWNER,
      })
      .expect(400);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it("rejects a duplicate pending invite with 409", async () => {
    const email = uniqueInviteEmail("duplicate");
    const created = await createOrganizationInvites(
      app,
      owner.accessToken,
      owner.orgId,
      {
        emails: [email],
        role: SharedOrganizationRole.MEMBER,
      }
    );

    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/organizations/invites`)
      .set(authHeaders(owner))
      .send({
        emails: [email],
        role: SharedOrganizationRole.ADMIN,
      })
      .expect(409);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.ORG_INVITE_ALREADY_PENDING);

    const inviteId = created[0]?.id;
    if (!inviteId) {
      throw new Error("expected a created invite");
    }
    await revokeInvite(inviteId);
  });

  it("rejects inviting an existing member with 409", async () => {
    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/organizations/invites`)
      .set(authHeaders(owner))
      .send({
        emails: [owner.email],
        role: SharedOrganizationRole.MEMBER,
      })
      .expect(409);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.ORG_MEMBER_ALREADY_EXISTS);
    expect(body.error.details).toEqual({ emails: [owner.email] });
  });

  it("skips already-member emails in a mixed batch and invites the rest", async () => {
    const newEmail = uniqueInviteEmail("mixed-batch");
    const created = await createOrganizationInvites(
      app,
      owner.accessToken,
      owner.orgId,
      {
        emails: [owner.email, newEmail],
        role: SharedOrganizationRole.MEMBER,
      }
    );

    expect(created).toHaveLength(1);
    expect(created[0]?.email).toBe(newEmail);

    const inviteId = created[0]?.id;
    if (!inviteId) {
      throw new Error("expected a created invite");
    }
    await revokeInvite(inviteId);
  });

  it("rejects a batch that would exceed the member seat cap with 429", async () => {
    const seatOwner = await registerLoginAndGetOrg(
      app,
      "invite-seats",
      "Invite Seat Org"
    );
    const limit = PLAN_LIMITS[PlanTier.FREE].members;
    if (limit === null) {
      throw new Error("expected a finite Free plan member limit");
    }

    const emails = Array.from({ length: limit }, (_, index) =>
      uniqueInviteEmail(`seat-${index}`)
    );

    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/organizations/invites`)
      .set(authHeaders(seatOwner, seatOwner.orgId))
      .send({
        emails,
        role: SharedOrganizationRole.MEMBER,
      })
      .expect(429);

    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.ORG_MEMBER_LIMIT_EXCEEDED);

    const listRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/organizations/invites`)
      .set(authHeaders(seatOwner, seatOwner.orgId))
      .expect(200);

    const listBody =
      listRes.body as ApiPaginatedSuccessResponseWire<OrganizationInviteResponseWire>;
    expect(listBody.data).toHaveLength(0);
  });

  it("omits the token from the org invite list", async () => {
    const email = uniqueInviteEmail("list-token");
    const created = await createOrganizationInvites(
      app,
      owner.accessToken,
      owner.orgId,
      { emails: [email], role: SharedOrganizationRole.MEMBER }
    );

    const res = await request(app.getHttpServer())
      .get(`${API_PREFIX}/organizations/invites`)
      .set(authHeaders(owner))
      .expect(200);

    const body =
      res.body as ApiPaginatedSuccessResponseWire<OrganizationInviteResponseWire>;
    const listed = body.data.find((invite) => invite.id === created[0]?.id);

    expect(listed).toBeDefined();
    expect(listed).not.toHaveProperty("token");
    expect(listed?.email).toBe(email);
    expect(listed?.invitedBy?.id).toBe(owner.userId);
  });

  it("lists expired invites in the org roster but not as PENDING", async () => {
    const email = uniqueInviteEmail("expired-list");
    const created = await createOrganizationInvites(
      app,
      owner.accessToken,
      owner.orgId,
      { emails: [email], role: SharedOrganizationRole.MEMBER }
    );
    const invite = created[0];
    if (!invite) {
      throw new Error("expected a created invite");
    }

    await database.client.organizationInvite.update({
      data: { expiresAt: new Date("2020-01-01T00:00:00.000Z") },
      where: { id: invite.id },
    });

    const res = await request(app.getHttpServer())
      .get(`${API_PREFIX}/organizations/invites`)
      .set(authHeaders(owner))
      .expect(200);

    const body =
      res.body as ApiPaginatedSuccessResponseWire<OrganizationInviteResponseWire>;
    const listed = body.data.find((item) => item.id === invite.id);

    expect(listed).toBeDefined();
    expect(listed?.status).toBe(OrganizationInviteStatus.EXPIRED);
    expect(listed).not.toHaveProperty("token");
  });

  it("rotates the stored token hash on resend", async () => {
    const email = uniqueInviteEmail("resend");
    const created = await createOrganizationInvites(
      app,
      owner.accessToken,
      owner.orgId,
      { emails: [email], role: SharedOrganizationRole.MEMBER }
    );
    const invite = created[0];
    if (!invite) {
      throw new Error("expected a created invite");
    }

    const before = await database.client.organizationInvite.findUnique({
      where: { id: invite.id },
    });
    if (!before) {
      throw new Error("expected invite row before resend");
    }

    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/organizations/invites/${invite.id}/resend`)
      .set(authHeaders(owner))
      .expect(200);

    const body =
      res.body as ApiSuccessResponseWire<OrganizationInviteCreatedResponseWire>;
    expect(body.data.token).not.toBe(invite.token);
    expect(body.data.id).toBe(invite.id);

    const after = await database.client.organizationInvite.findUnique({
      where: { id: invite.id },
    });
    if (!after) {
      throw new Error("expected invite row after resend");
    }

    expect(after.tokenHash).not.toBe(before.tokenHash);
    expect(after.tokenHash).toBe(hashService.digest(body.data.token));
    expect(before.tokenHash).toBe(hashService.digest(invite.token));
  });

  it("does not fold pending invites into GET /organizations", async () => {
    const orgsRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/organizations`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(200);

    const orgsBody = orgsRes.body as ApiSuccessResponseWire<
      UserOrganizationResponseWire[]
    >;
    expect(orgsBody.data[0]).not.toHaveProperty("invites");
    expect(orgsBody.data[0]?.orgId).toBe(owner.orgId);
  });

  it("does not let another org list or revoke this org's invites", async () => {
    const email = uniqueInviteEmail("isolation");
    const created = await createOrganizationInvites(
      app,
      owner.accessToken,
      owner.orgId,
      { emails: [email], role: SharedOrganizationRole.MEMBER }
    );
    const inviteId = created[0]?.id;
    if (!inviteId) {
      throw new Error("expected a created invite");
    }

    const listRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/organizations/invites`)
      .set(authHeaders(otherOrg, otherOrg.orgId))
      .expect(200);

    const listBody =
      listRes.body as ApiPaginatedSuccessResponseWire<OrganizationInviteResponseWire>;
    expect(
      listBody.data.find((invite) => invite.id === inviteId)
    ).toBeUndefined();

    const revokeRes = await request(app.getHttpServer())
      .delete(`${API_PREFIX}/organizations/invites/${inviteId}`)
      .set(authHeaders(otherOrg, otherOrg.orgId))
      .expect(404);

    const revokeBody = revokeRes.body as ApiGeneralErrorResponseWire;
    expect(revokeBody.error.code).toBe(ErrorCode.ORG_INVITE_NOT_FOUND);
  });

  function authHeaders(user: RegisteredUser, orgId = owner.orgId) {
    return {
      Authorization: `Bearer ${user.accessToken}`,
      [AUTH_CONSTANTS.ORG_ID_HEADER]: orgId,
    };
  }

  async function expectForbidden(req: request.Test): Promise<void> {
    const res = await req.expect(403);
    const body = res.body as ApiGeneralErrorResponseWire;
    expect(body.error.code).toBe(ErrorCode.FORBIDDEN);
  }

  async function revokeInvite(id: string): Promise<void> {
    await request(app.getHttpServer())
      .delete(`${API_PREFIX}/organizations/invites/${id}`)
      .set(authHeaders(owner))
      .expect(200);
  }

  function uniqueInviteEmail(label: string): string {
    return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@rivet.test`;
  }
});
