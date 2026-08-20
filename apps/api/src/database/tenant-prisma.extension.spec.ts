import { PrismaClient } from "@generated/prisma";
import { InternalServerErrorException } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";

import { createTenantScopedClient } from "./tenant-prisma.extension";

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
