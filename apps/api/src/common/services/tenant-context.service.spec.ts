import { ClsService } from "nestjs-cls";

import {
  TENANT_CONTEXT_KEYS,
  type TenantContextStore,
} from "@/common/constants";

import { TenantContextService } from "./tenant-context.service";

function createService() {
  const set = jest.fn();
  const cls = {
    run: jest.fn((fn: () => unknown) => fn()),
    set,
    get: jest.fn(),
  };

  return {
    cls,
    service: new TenantContextService(
      cls as unknown as ClsService<TenantContextStore>
    ),
    set,
  };
}

describe("TenantContextService.runWithTenantContext", () => {
  it("sets orgId and userId inside cls.run", async () => {
    const { service, cls, set } = createService();

    const result = await service.runWithTenantContext(
      { orgId: "org-1", userId: "user-1" },
      () => "ok"
    );

    expect(result).toBe("ok");
    expect(cls.run).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith(TENANT_CONTEXT_KEYS.orgId, "org-1");
    expect(set).toHaveBeenCalledWith(TENANT_CONTEXT_KEYS.userId, "user-1");
    expect(set).not.toHaveBeenCalledWith(
      TENANT_CONTEXT_KEYS.orgRole,
      expect.anything()
    );
  });

  it("sets orgRole when provided", async () => {
    const { service, set } = createService();

    await service.runWithTenantContext(
      {
        orgId: "org-1",
        userId: "user-1",
        orgRole: "VIEWER",
      },
      () => undefined
    );

    expect(set).toHaveBeenCalledWith(TENANT_CONTEXT_KEYS.orgRole, "VIEWER");
  });
});
