import { PrismaClient } from "@generated/prisma";
import { InternalServerErrorException } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  applyTenantScope,
  createTenantScopedClient,
} from "./tenant-prisma.extension";
import { TENANT_ORG_FIELD } from "./tenant-scoped.models";

describe("tenant-scoped ExportJob queries", () => {
  it("throws when CLS org is missing", async () => {
    const base = new PrismaClient({
      adapter: new PrismaPg("postgresql://localhost:5432/rivet"),
    });
    const client = createTenantScopedClient(base, () => undefined);
    const scoped = client as unknown as PrismaClient;

    await expect(scoped.exportJob.findMany()).rejects.toBeInstanceOf(
      InternalServerErrorException
    );
    await expect(scoped.exportJob.findMany()).rejects.toThrow(
      "Tenant org context is required for ExportJob.findMany"
    );

    await base.$disconnect();
  });
});

describe("applyTenantScope update data", () => {
  const orgId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const otherOrgId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  it("stamps organizationId on update data", () => {
    const scoped = applyTenantScope(
      "update",
      { data: { name: "Renamed" }, where: { id: "row-1" } },
      orgId
    );

    expect(scoped.where).toEqual({
      id: "row-1",
      [TENANT_ORG_FIELD]: orgId,
    });
    expect(scoped.data).toEqual({
      name: "Renamed",
      [TENANT_ORG_FIELD]: orgId,
    });
  });

  it("rejects update data that re-homes organizationId", () => {
    expect(() =>
      applyTenantScope(
        "update",
        {
          data: { [TENANT_ORG_FIELD]: otherOrgId },
          where: { id: "row-1" },
        },
        orgId
      )
    ).toThrow(InternalServerErrorException);
  });

  it("stamps organizationId on upsert update branch", () => {
    const scoped = applyTenantScope(
      "upsert",
      {
        create: { name: "New" },
        update: { name: "Existing" },
        where: { id: "row-1" },
      },
      orgId
    );

    expect(scoped.update).toEqual({
      name: "Existing",
      [TENANT_ORG_FIELD]: orgId,
    });
    expect(scoped.create).toEqual({
      name: "New",
      [TENANT_ORG_FIELD]: orgId,
    });
  });

  it("rejects upsert update that re-homes organizationId", () => {
    expect(() =>
      applyTenantScope(
        "upsert",
        {
          create: { name: "New" },
          update: { [TENANT_ORG_FIELD]: otherOrgId },
          where: { id: "row-1" },
        },
        orgId
      )
    ).toThrow(InternalServerErrorException);
  });
});
