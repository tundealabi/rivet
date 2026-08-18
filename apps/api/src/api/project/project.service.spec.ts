import { PlanTier } from "@generated/prisma";
import { PLAN_LIMITS } from "@rivet/shared/constants";
import { ErrorCode } from "@rivet/shared/enums";

import { TenantContextService } from "@/common/services";
import { DatabaseService } from "@/database/database.service";
import { OrgService } from "@/modules/org/org.service";
import { ProjectService as ProjectModuleService } from "@/modules/project/project.service";

import { ProjectService } from "./project.service";

const orgId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const userId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const projectId = "dddddddd-dddd-dddd-dddd-dddddddddddd";

const createInput = {
  createdById: userId,
  description: "A project",
  key: "PRJ",
  name: "Project",
};

function projectRow(
  overrides: Partial<{
    archivedAt: Date | null;
    createdAt: Date;
    description: string;
    id: string;
    key: string;
    name: string;
    organizationId: string;
  }> = {}
) {
  return {
    archivedAt: null,
    createdAt: new Date("2026-08-15T12:00:00.000Z"),
    createdById: userId,
    description: createInput.description,
    id: projectId,
    key: createInput.key,
    name: createInput.name,
    nextIssueNumber: 1,
    organizationId: orgId,
    updatedAt: new Date("2026-08-15T12:00:00.000Z"),
    ...overrides,
  };
}

function createService(overrides?: {
  countInOrg?: jest.Mock;
  create?: jest.Mock;
  findById?: jest.Mock;
}) {
  const create = overrides?.create ?? jest.fn().mockResolvedValue(projectRow());
  const countInOrg = overrides?.countInOrg ?? jest.fn().mockResolvedValue(0);
  const transaction = jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({})
  );

  const service = new ProjectService(
    {
      client: { $transaction: transaction },
    } as unknown as DatabaseService,
    {
      findById:
        overrides?.findById ??
        jest.fn().mockResolvedValue({ id: orgId, planTier: PlanTier.FREE }),
    } as unknown as OrgService,
    {
      countInOrg,
      create,
    } as unknown as ProjectModuleService,
    {
      orgId,
      userId,
    } as TenantContextService
  );

  return { countInOrg, create, service, transaction };
}

describe("ProjectService", () => {
  it("creates a project when the org is under the Free cap", async () => {
    const { create, service } = createService({
      countInOrg: jest.fn().mockResolvedValue(2),
    });

    const result = await service.createProject(createInput);

    expect(create).toHaveBeenCalled();
    expect(result.id).toBe(projectId);
  });

  it("returns ORG_PROJECT_LIMIT_EXCEEDED when the org is at the project cap", async () => {
    const { create, service } = createService({
      countInOrg: jest.fn().mockResolvedValue(3),
    });

    await expect(service.createProject(createInput)).rejects.toMatchObject({
      code: ErrorCode.ORG_PROJECT_LIMIT_EXCEEDED,
      kind: "TOO_MANY_REQUESTS",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("applies the Pro project cap", async () => {
    const limit = PLAN_LIMITS[PlanTier.PRO].projects;
    if (limit === null) {
      throw new Error("expected a finite Pro plan project limit");
    }

    const under = createService({
      countInOrg: jest.fn().mockResolvedValue(limit - 1),
      findById: jest
        .fn()
        .mockResolvedValue({ id: orgId, planTier: PlanTier.PRO }),
    });
    await under.service.createProject(createInput);
    expect(under.create).toHaveBeenCalled();

    const atCap = createService({
      countInOrg: jest.fn().mockResolvedValue(limit),
      findById: jest
        .fn()
        .mockResolvedValue({ id: orgId, planTier: PlanTier.PRO }),
    });
    await expect(
      atCap.service.createProject(createInput)
    ).rejects.toMatchObject({
      code: ErrorCode.ORG_PROJECT_LIMIT_EXCEEDED,
      kind: "TOO_MANY_REQUESTS",
    });
    expect(atCap.create).not.toHaveBeenCalled();
  });

  it("does not cap Team plan projects", async () => {
    const { create, service } = createService({
      countInOrg: jest.fn().mockResolvedValue(10_000),
      findById: jest
        .fn()
        .mockResolvedValue({ id: orgId, planTier: PlanTier.TEAM }),
    });

    await service.createProject(createInput);
    expect(create).toHaveBeenCalled();
  });
});
