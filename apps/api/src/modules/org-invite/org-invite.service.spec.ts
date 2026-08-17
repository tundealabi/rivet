import { OrganizationInvite, OrganizationRole } from "@generated/prisma";
import { ErrorCode } from "@rivet/shared/enums";

import { OrgInviteRepository } from "./org-invite.repository";
import { OrgInviteService } from "./org-invite.service";

function inviteRow(
  overrides: Partial<OrganizationInvite> = {}
): OrganizationInvite {
  return {
    acceptedAt: null,
    createdAt: new Date("2026-08-17T12:00:00.000Z"),
    declinedAt: null,
    email: "ada@example.com",
    expiresAt: new Date("2026-08-24T12:00:00.000Z"),
    id: "invite-1",
    invitedById: "user-1",
    lastSentAt: new Date("2026-08-17T12:00:00.000Z"),
    organizationId: "org-1",
    revokedAt: null,
    role: OrganizationRole.MEMBER,
    tokenHash: "hash-1",
    updatedAt: new Date("2026-08-17T12:00:00.000Z"),
    ...overrides,
  };
}

const now = new Date("2026-08-17T12:00:00.000Z");

function lifecycle(
  overrides: Partial<
    Pick<
      OrganizationInvite,
      "acceptedAt" | "declinedAt" | "expiresAt" | "revokedAt"
    >
  > = {}
) {
  return {
    acceptedAt: null,
    declinedAt: null,
    expiresAt: new Date("2026-08-24T12:00:00.000Z"),
    revokedAt: null,
    ...overrides,
  };
}

describe("OrgInviteService", () => {
  const create = jest.fn();
  const count = jest.fn();
  const findFirst = jest.fn();
  const findMany = jest.fn();
  const findUnique = jest.fn();
  const updateMany = jest.fn();

  const service = new OrgInviteService({
    count,
    create,
    findFirst,
    findMany,
    findUnique,
    update: jest.fn(),
    updateMany,
  } as unknown as OrgInviteRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const input = {
      email: "  Ada@Example.com ",
      expiresAt: new Date("2026-08-24T12:00:00.000Z"),
      invitedById: "user-1",
      lastSentAt: new Date("2026-08-17T12:00:00.000Z"),
      orgId: "org-1",
      role: OrganizationRole.MEMBER,
      tokenHash: "hash-1",
    };

    it("rejects OWNER as an invite role", async () => {
      await expect(
        service.create({ ...input, role: OrganizationRole.OWNER })
      ).rejects.toMatchObject({
        code: ErrorCode.UNPROCESSABLE_ENTITY,
        kind: "RULE_VIOLATION",
      });

      expect(create).not.toHaveBeenCalled();
    });

    it("stores a trimmed lowercase email", async () => {
      create.mockResolvedValueOnce(inviteRow());

      await service.create(input);

      expect(create.mock.calls[0][0].data).toMatchObject({
        email: "ada@example.com",
        organizationId: "org-1",
        role: OrganizationRole.MEMBER,
        tokenHash: "hash-1",
      });
    });
  });

  describe("findActiveByOrgAndEmails", () => {
    it("returns an empty list without querying when emails is empty", async () => {
      await expect(
        service.findActiveByOrgAndEmails({ emails: [], orgId: "org-1" })
      ).resolves.toEqual([]);

      expect(findMany).not.toHaveBeenCalled();
    });

    it("looks up active invites for the normalized emails in one query", async () => {
      const rows = [
        inviteRow(),
        inviteRow({ email: "bob@example.com", id: "invite-2" }),
      ];
      findMany.mockResolvedValueOnce(rows);

      await expect(
        service.findActiveByOrgAndEmails({
          emails: ["  Ada@Example.com ", "bob@example.com", "ada@example.com"],
          orgId: "org-1",
        })
      ).resolves.toEqual(rows);

      expect(findMany.mock.calls[0][0].where).toMatchObject({
        acceptedAt: null,
        declinedAt: null,
        email: { in: ["ada@example.com", "bob@example.com"] },
        organizationId: "org-1",
        revokedAt: null,
      });
    });
  });

  describe("consume", () => {
    it("updates only an active invite and returns the row", async () => {
      const acceptedAt = new Date("2026-08-17T13:00:00.000Z");
      const consumed = inviteRow({ acceptedAt });

      updateMany.mockResolvedValueOnce({ count: 1 });
      findUnique.mockResolvedValueOnce(consumed);

      await expect(
        service.consume({ acceptedAt, id: "invite-1" })
      ).resolves.toEqual(consumed);

      expect(updateMany.mock.calls[0][0]).toMatchObject({
        data: { acceptedAt },
        where: {
          acceptedAt: null,
          declinedAt: null,
          id: "invite-1",
          revokedAt: null,
        },
      });
    });

    it("throws when the invite is not active", async () => {
      updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(
        service.consume({
          acceptedAt: new Date("2026-08-17T13:00:00.000Z"),
          id: "invite-1",
        })
      ).rejects.toMatchObject({
        code: ErrorCode.ORG_INVITE_NOT_FOUND,
        kind: "NOT_FOUND",
      });
    });
  });

  describe("countActiveInOrg", () => {
    it("counts open unexpired invites in the org", async () => {
      count.mockResolvedValueOnce(2);

      await expect(service.countActiveInOrg({ orgId: "org-1" })).resolves.toBe(
        2
      );

      expect(count.mock.calls[0][0].where).toMatchObject({
        acceptedAt: null,
        declinedAt: null,
        organizationId: "org-1",
        revokedAt: null,
      });
    });
  });

  describe("isOpen", () => {
    it("is open when no terminal timestamp is set", () => {
      expect(service.isOpen(lifecycle())).toBe(true);
    });

    it("is not open once accepted, declined, or revoked", () => {
      expect(service.isOpen(lifecycle({ acceptedAt: now }))).toBe(false);
      expect(service.isOpen(lifecycle({ declinedAt: now }))).toBe(false);
      expect(service.isOpen(lifecycle({ revokedAt: now }))).toBe(false);
    });
  });

  describe("isActive", () => {
    it("is active when open and expires after now", () => {
      expect(service.isActive(lifecycle(), now)).toBe(true);
    });

    it("is not active at the exact expiry instant", () => {
      expect(service.isActive(lifecycle({ expiresAt: now }), now)).toBe(false);
    });

    it("is not active when expired even if still open", () => {
      expect(
        service.isActive(
          lifecycle({ expiresAt: new Date("2026-08-17T11:59:59.000Z") }),
          now
        )
      ).toBe(false);
    });

    it("is not active after consume", () => {
      expect(service.isActive(lifecycle({ acceptedAt: now }), now)).toBe(false);
    });
  });

  describe("isExpired", () => {
    it("is expired when open and expiresAt is not after now", () => {
      expect(service.isExpired(lifecycle({ expiresAt: now }), now)).toBe(true);
    });

    it("is not expired when still active", () => {
      expect(service.isExpired(lifecycle(), now)).toBe(false);
    });

    it("is not expired after revoke even if the clock has passed", () => {
      expect(
        service.isExpired(
          lifecycle({
            expiresAt: new Date("2026-08-01T00:00:00.000Z"),
            revokedAt: now,
          }),
          now
        )
      ).toBe(false);
    });
  });
});
