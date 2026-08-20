import { OrganizationRole } from "@generated/prisma";
import type { INestApplication } from "@nestjs/common";
import type {
  AcceptInvitationResponseWire,
  ApiGeneralErrorResponseWire,
  ApiPaginatedSuccessResponseWire,
  ApiSuccessResponseWire,
  InvitationPreviewResponseWire,
  OrganizationInviteCreatedResponseWire,
  OrganizationMemberResponseWire,
  UserInvitationResponseWire,
  UserOrganizationResponseWire,
} from "@rivet/shared/api";
import { PLAN_LIMITS } from "@rivet/shared/constants";
import {
  ErrorCode,
  OrganizationRole as SharedOrganizationRole,
  PlanTier,
} from "@rivet/shared/enums";
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
import { createOrganizationInvites } from "./helpers/fixtures/org-invite";
import { addOrgMember } from "./helpers/fixtures/org-member";

describe("Invitations (e2e)", () => {
  let app: INestApplication<App>;
  let owner: RegisteredUser;
  let rbacOwner: RegisteredUser;
  let member: RegisteredUser;
  let viewer: RegisteredUser;
  let stranger: RegisteredUser;
  let database: DatabaseService;

  beforeAll(async () => {
    app = await createE2eApp();
    database = app.get(DatabaseService);

    owner = await registerLoginAndGetOrg(
      app,
      "invitations-owner",
      "Invitations Owner Org"
    );
    rbacOwner = await registerLoginAndGetOrg(
      app,
      "invitations-rbac",
      "Invitations RBAC Org"
    );
    member = await registerLoginAndGetOrg(
      app,
      "invitations-member",
      "Invitations Member Own Org"
    );
    viewer = await registerLoginAndGetOrg(
      app,
      "invitations-viewer",
      "Invitations Viewer Own Org"
    );
    stranger = await registerLoginAndGetOrg(
      app,
      "invitations-stranger",
      "Invitations Stranger Org"
    );

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

  it("lists pending invitations without a token and accepts by id", async () => {
    const invitee = await registerInvitee("accept-by-id");
    const created = await inviteToOwner(invitee.email);
    const invite = created[0];
    if (!invite) {
      throw new Error("expected a created invite");
    }

    const listRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/invitations`)
      .set(bearer(invitee))
      .expect(200);

    const listBody =
      listRes.body as ApiPaginatedSuccessResponseWire<UserInvitationResponseWire>;
    const listed = listBody.data.find((item) => item.id === invite.id);

    expect(listed).toBeDefined();
    expect(listed).not.toHaveProperty("token");
    expect(listed?.orgId).toBe(owner.orgId);
    expect(listed?.orgName).toBe("Invitations Owner Org");
    expect(listed?.role).toBe(SharedOrganizationRole.MEMBER);
    expect(listed?.invitedByName).toBe("Test User");

    const acceptRes = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/${invite.id}/accept`)
      .set(bearer(invitee))
      .expect(200);

    const acceptBody =
      acceptRes.body as ApiSuccessResponseWire<AcceptInvitationResponseWire>;
    expect(acceptBody.data).toEqual({
      orgId: owner.orgId,
      orgName: "Invitations Owner Org",
      role: SharedOrganizationRole.MEMBER,
    });

    const orgsRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/organizations`)
      .set(bearer(invitee))
      .expect(200);

    const orgsBody = orgsRes.body as ApiSuccessResponseWire<
      UserOrganizationResponseWire[]
    >;
    expect(orgsBody.data.map((org) => org.orgId)).toEqual(
      expect.arrayContaining([invitee.orgId, owner.orgId])
    );

    const membersRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/organizations/members`)
      .set(orgAuth(owner))
      .expect(200);

    const membersBody =
      membersRes.body as ApiPaginatedSuccessResponseWire<OrganizationMemberResponseWire>;
    expect(
      membersBody.data.find((item) => item.email === invitee.email)?.role
    ).toBe(SharedOrganizationRole.MEMBER);

    const secondRes = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/${invite.id}/accept`)
      .set(bearer(invitee))
      .expect(409);

    const secondBody = secondRes.body as ApiGeneralErrorResponseWire;
    expect(secondBody.error.code).toBe(ErrorCode.ORG_MEMBER_ALREADY_EXISTS);
  }, 30_000);

  it("accepts an invitation by token", async () => {
    const invitee = await registerInvitee("accept-by-token");
    const created = await inviteToOwner(invitee.email);
    const invite = created[0];
    if (!invite) {
      throw new Error("expected a created invite");
    }

    const previewRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/invitations/preview`)
      .query({ token: invite.token })
      .expect(200);

    const previewBody =
      previewRes.body as ApiSuccessResponseWire<InvitationPreviewResponseWire>;
    expect(previewBody.data).toEqual({
      orgName: "Invitations Owner Org",
      role: SharedOrganizationRole.MEMBER,
    });

    const acceptRes = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/accept`)
      .set(bearer(invitee))
      .send({ token: invite.token })
      .expect(200);

    const acceptBody =
      acceptRes.body as ApiSuccessResponseWire<AcceptInvitationResponseWire>;
    expect(acceptBody.data.orgId).toBe(owner.orgId);
    expect(acceptBody.data.role).toBe(SharedOrganizationRole.MEMBER);
  }, 30_000);

  it("forbids accepting when the authenticated email does not match", async () => {
    const invitee = await registerInvitee("wrong-email");
    const created = await inviteToOwner(invitee.email);
    const invite = created[0];
    if (!invite) {
      throw new Error("expected a created invite");
    }

    const byId = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/${invite.id}/accept`)
      .set(bearer(stranger))
      .expect(403);

    expect((byId.body as ApiGeneralErrorResponseWire).error.code).toBe(
      ErrorCode.FORBIDDEN
    );

    const byToken = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/accept`)
      .set(bearer(stranger))
      .send({ token: invite.token })
      .expect(403);

    expect((byToken.body as ApiGeneralErrorResponseWire).error.code).toBe(
      ErrorCode.FORBIDDEN
    );

    await revokeOwnerInvite(invite.id);
  }, 30_000);

  it("forbids declining when the authenticated email does not match", async () => {
    const invitee = await registerInvitee("decline-wrong-email");
    const created = await inviteToOwner(invitee.email);
    const inviteId = created[0]?.id;
    if (!inviteId) {
      throw new Error("expected a created invite");
    }

    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/${inviteId}/decline`)
      .set(bearer(stranger))
      .expect(403);

    expect((res.body as ApiGeneralErrorResponseWire).error.code).toBe(
      ErrorCode.FORBIDDEN
    );

    await revokeOwnerInvite(inviteId);
  }, 30_000);

  it("does not let another user accept someone else's invite id", async () => {
    const invitee = await registerInvitee("cross-org");
    const created = await inviteToOwner(invitee.email);
    const inviteId = created[0]?.id;
    if (!inviteId) {
      throw new Error("expected a created invite");
    }

    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/${inviteId}/accept`)
      .set(bearer(stranger))
      .expect(403);

    expect((res.body as ApiGeneralErrorResponseWire).error.code).toBe(
      ErrorCode.FORBIDDEN
    );

    await revokeOwnerInvite(inviteId);
  }, 30_000);

  it("returns not found for an expired token", async () => {
    const invitee = await registerInvitee("expired");
    const created = await inviteToOwner(invitee.email);
    const invite = created[0];
    if (!invite) {
      throw new Error("expected a created invite");
    }

    await database.client.organizationInvite.update({
      data: { expiresAt: new Date("2020-01-01T00:00:00.000Z") },
      where: { id: invite.id },
    });

    const previewRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/invitations/preview`)
      .query({ token: invite.token })
      .expect(404);

    expect((previewRes.body as ApiGeneralErrorResponseWire).error.code).toBe(
      ErrorCode.ORG_INVITE_NOT_FOUND
    );

    const acceptRes = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/accept`)
      .set(bearer(invitee))
      .send({ token: invite.token })
      .expect(404);

    expect((acceptRes.body as ApiGeneralErrorResponseWire).error.code).toBe(
      ErrorCode.ORG_INVITE_NOT_FOUND
    );

    const listRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/invitations`)
      .set(bearer(invitee))
      .expect(200);

    const listBody =
      listRes.body as ApiPaginatedSuccessResponseWire<UserInvitationResponseWire>;
    expect(listBody.data.find((item) => item.id === invite.id)).toBeUndefined();
  }, 30_000);

  it("does not allow accept after revoke", async () => {
    const invitee = await registerInvitee("revoked");
    const created = await inviteToOwner(invitee.email);
    const invite = created[0];
    if (!invite) {
      throw new Error("expected a created invite");
    }

    await request(app.getHttpServer())
      .delete(`${API_PREFIX}/organizations/invites/${invite.id}`)
      .set(orgAuth(owner))
      .expect(200);

    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/accept`)
      .set(bearer(invitee))
      .send({ token: invite.token })
      .expect(404);

    expect((res.body as ApiGeneralErrorResponseWire).error.code).toBe(
      ErrorCode.ORG_INVITE_NOT_FOUND
    );
  }, 30_000);

  it("does not allow accept after decline", async () => {
    const invitee = await registerInvitee("declined");
    const created = await inviteToOwner(invitee.email);
    const invite = created[0];
    if (!invite) {
      throw new Error("expected a created invite");
    }

    await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/${invite.id}/decline`)
      .set(bearer(invitee))
      .expect(200);

    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/${invite.id}/accept`)
      .set(bearer(invitee))
      .expect(404);

    expect((res.body as ApiGeneralErrorResponseWire).error.code).toBe(
      ErrorCode.ORG_INVITE_NOT_FOUND
    );
  }, 30_000);

  it("lets a viewer accept their own invite without x-org-id", async () => {
    const created = await inviteToOwner(viewer.email);
    const invite = created[0];
    if (!invite) {
      throw new Error("expected a created invite");
    }

    const listRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/invitations`)
      .set(bearer(viewer))
      .expect(200);

    const listBody =
      listRes.body as ApiPaginatedSuccessResponseWire<UserInvitationResponseWire>;
    expect(listBody.data.find((item) => item.id === invite.id)).toBeDefined();

    const acceptRes = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/${invite.id}/accept`)
      .set(bearer(viewer))
      .expect(200);

    const acceptBody =
      acceptRes.body as ApiSuccessResponseWire<AcceptInvitationResponseWire>;
    expect(acceptBody.data.orgId).toBe(owner.orgId);
  });

  it("lets a member accept their own invite even when x-org-id is another org", async () => {
    const created = await inviteToOwner(member.email);
    const invite = created[0];
    if (!invite) {
      throw new Error("expected a created invite");
    }

    const acceptRes = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/${invite.id}/accept`)
      .set({
        Authorization: `Bearer ${member.accessToken}`,
        [AUTH_CONSTANTS.ORG_ID_HEADER]: rbacOwner.orgId,
      })
      .expect(200);

    const acceptBody =
      acceptRes.body as ApiSuccessResponseWire<AcceptInvitationResponseWire>;
    expect(acceptBody.data.orgId).toBe(owner.orgId);
  });

  it("frees the invite seat on accept so another invite can be created", async () => {
    const seatOwner = await registerLoginAndGetOrg(
      app,
      "invitations-seats",
      "Invitations Seat Org"
    );
    const seatInvitee = await registerLoginAndGetOrg(
      app,
      "invitations-seat-invitee",
      "Invitations Seat Invitee Org"
    );
    const limit = PLAN_LIMITS[PlanTier.FREE].members;
    if (limit === null) {
      throw new Error("expected a finite Free plan member limit");
    }

    const fillerEmails = Array.from({ length: limit - 3 }, (_, index) =>
      uniqueInviteEmail(`seat-filler-${index}`)
    );
    const created = await createOrganizationInvites(
      app,
      seatOwner.accessToken,
      seatOwner.orgId,
      {
        emails: [seatInvitee.email, ...fillerEmails],
        role: SharedOrganizationRole.MEMBER,
      }
    );
    const invite = created.find((item) => item.email === seatInvitee.email);
    if (!invite) {
      throw new Error("expected an invite for the seat invitee");
    }

    await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/${invite.id}/accept`)
      .set(bearer(seatInvitee))
      .expect(200);

    const followUp = await createOrganizationInvites(
      app,
      seatOwner.accessToken,
      seatOwner.orgId,
      {
        emails: [uniqueInviteEmail("seat-follow-up")],
        role: SharedOrganizationRole.MEMBER,
      }
    );
    expect(followUp).toHaveLength(1);
  }, 30_000);

  it("rejects accept when the org is already at the member seat cap", async () => {
    const seatOwner = await registerLoginAndGetOrg(
      app,
      "invitations-accept-cap",
      "Invitations Accept Cap Org"
    );
    const seatInvitee = await registerLoginAndGetOrg(
      app,
      "invitations-accept-cap-invitee",
      "Invitations Accept Cap Invitee Org"
    );
    const created = await createOrganizationInvites(
      app,
      seatOwner.accessToken,
      seatOwner.orgId,
      {
        emails: [seatInvitee.email],
        role: SharedOrganizationRole.MEMBER,
      }
    );
    const invite = created[0];
    if (!invite) {
      throw new Error("expected a created invite");
    }

    const extras = [member, viewer, stranger, rbacOwner];
    const limit = PLAN_LIMITS[PlanTier.FREE].members;
    if (limit === null) {
      throw new Error("expected a finite Free plan member limit");
    }
    if (extras.length !== limit - 1) {
      throw new Error(
        `expected ${limit - 1} extra members to fill a Free org that already has an owner`
      );
    }

    for (const extra of extras) {
      await addOrgMember(app, {
        orgId: seatOwner.orgId,
        role: OrganizationRole.MEMBER,
        userId: extra.userId,
      });
    }

    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/${invite.id}/accept`)
      .set(bearer(seatInvitee))
      .expect(429);

    expect((res.body as ApiGeneralErrorResponseWire).error.code).toBe(
      ErrorCode.ORG_MEMBER_LIMIT_EXCEEDED
    );

    const membersRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/organizations/members`)
      .set(orgAuth(seatOwner))
      .expect(200);

    const membersBody =
      membersRes.body as ApiPaginatedSuccessResponseWire<OrganizationMemberResponseWire>;
    expect(
      membersBody.data.find((item) => item.email === seatInvitee.email)
    ).toBeUndefined();

    const listRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/invitations`)
      .set(bearer(seatInvitee))
      .expect(200);

    const listBody =
      listRes.body as ApiPaginatedSuccessResponseWire<UserInvitationResponseWire>;
    expect(listBody.data.find((item) => item.id === invite.id)).toBeDefined();
  }, 30_000);

  it("closes a leftover pending invite when the user is already a member", async () => {
    const leftoverOwner = await registerLoginAndGetOrg(
      app,
      "invitations-leftover-owner",
      "Invitations Leftover Owner Org"
    );
    const invitee = await registerInvitee("already-member");
    const created = await createOrganizationInvites(
      app,
      leftoverOwner.accessToken,
      leftoverOwner.orgId,
      {
        emails: [invitee.email],
        role: SharedOrganizationRole.MEMBER,
      }
    );
    const invite = created[0];
    if (!invite) {
      throw new Error("expected a created invite");
    }

    await addOrgMember(app, {
      orgId: leftoverOwner.orgId,
      role: OrganizationRole.MEMBER,
      userId: invitee.userId,
    });

    const res = await request(app.getHttpServer())
      .post(`${API_PREFIX}/invitations/${invite.id}/accept`)
      .set(bearer(invitee))
      .expect(409);

    expect((res.body as ApiGeneralErrorResponseWire).error.code).toBe(
      ErrorCode.ORG_MEMBER_ALREADY_EXISTS
    );

    const listRes = await request(app.getHttpServer())
      .get(`${API_PREFIX}/invitations`)
      .set(bearer(invitee))
      .expect(200);

    const listBody =
      listRes.body as ApiPaginatedSuccessResponseWire<UserInvitationResponseWire>;
    expect(listBody.data.find((item) => item.id === invite.id)).toBeUndefined();
  }, 30_000);

  it("returns the same generic not-found for an invalid preview token", async () => {
    const res = await request(app.getHttpServer())
      .get(`${API_PREFIX}/invitations/preview`)
      .query({ token: "not-a-real-token" })
      .expect(404);

    expect((res.body as ApiGeneralErrorResponseWire).error.code).toBe(
      ErrorCode.ORG_INVITE_NOT_FOUND
    );
  });

  function bearer(user: RegisteredUser) {
    return {
      Authorization: `Bearer ${user.accessToken}`,
    };
  }

  function orgAuth(user: RegisteredUser, orgId = user.orgId) {
    return {
      Authorization: `Bearer ${user.accessToken}`,
      [AUTH_CONSTANTS.ORG_ID_HEADER]: orgId,
    };
  }

  async function registerInvitee(label: string): Promise<RegisteredUser> {
    return registerLoginAndGetOrg(
      app,
      `invitations-${label}`,
      `Invitations ${label} Org`
    );
  }

  async function inviteToOwner(
    email: string
  ): Promise<OrganizationInviteCreatedResponseWire[]> {
    return createOrganizationInvites(app, owner.accessToken, owner.orgId, {
      emails: [email],
      role: SharedOrganizationRole.MEMBER,
    });
  }

  async function revokeOwnerInvite(id: string): Promise<void> {
    await request(app.getHttpServer())
      .delete(`${API_PREFIX}/organizations/invites/${id}`)
      .set(orgAuth(owner))
      .expect(200);
  }

  function uniqueInviteEmail(label: string): string {
    return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@rivet.test`;
  }
});
